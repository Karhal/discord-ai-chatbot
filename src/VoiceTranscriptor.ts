import pkg from '@discordjs/opus';
import path from 'path';
const { OpusEncoder } = pkg;

import {
  AudioPlayerStatus,
  EndBehaviorType,
  createAudioResource,
  createAudioPlayer
} from '@discordjs/voice';

import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { SpeechClient } from '@google-cloud/speech';
import fs from 'fs';
import { join } from 'path';
//const aiCompletionHandler  = require('./handlers/AiCompletionHandler');

const REQUEST_CONFIG = {
  encoding: 'LINEAR16',
  sampleRateHertz: 48000,
  languageCode: 'fr-FR', // Change to the language you want
  audioChannelCount: 2
};

class VoiceTranscriptor {
  connection;
  receiver;
  speechClient = new SpeechClient();
  message;
  commandsChannel;
  time;
  messageId;
  aiCompletionHandler;

  constructor(connection, completionHandler) {
    this.connection = connection;
    this.receiver = this.connection.receiver;
    this.aiCompletionHandler = completionHandler;
  }

  async listen(userId) {
    try {
      console.log(`Listening to ${userId} 🦎`);
      this.dataSubscriptions(userId);
    }
    catch (error) {
      console.log(error);
    }
  }

  dataSubscriptions(userId) {
    const subscription = this.receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterSilence,
        duration: 100
      }
    });

    const buffers = [];
    const encoder = new OpusEncoder(48000, 2);

    subscription.on('data', (chunk) => {
      console.log(buffers.length);
      buffers.push(encoder.decode(chunk));
    }); // Subscription on when we receive data

    subscription.once('end', async () => {
      if (buffers.length < 70) {
        return console.log('Audio is too short');
      }
      this.time = performance.now();

      const outputPath = this.getOutputPath(buffers);
      const transcription = await this.getTranscription(outputPath);
      console.log(transcription);

      if (transcription.length > 5) {
        const aiCompletion = await this.aiCompletionHandler.getAiCompletion(
          userId,
          transcription,
          ''
        );
        console.log(aiCompletion);
        this.AISpeech(aiCompletion);

        return;
      } // The transcription has a minimum of 5 letters
    }); // Subscription on when user stops talking
  }

  async getTranscription(tempFileName) {
    try {
      const bytes = fs.readFileSync(tempFileName).toString('base64');
      const request = {
        audio: {
          content: bytes
        },
        config: REQUEST_CONFIG
      };

      const [response] = await this.speechClient.recognize(request);
      if (response && response.results) {
        const transcription = response.results
          .map((result) => {
            if (result.alternatives) {
              return result.alternatives[0].transcript;
            }
            else {
              console.log(result);
              throw Error('No alternatives');
            }
          })
          .join('\n');

        return transcription.toLowerCase();
      }
      else {
        console.log(response);
        throw Error('No response or response results');
      }
    }
    catch (error) {
      console.log(error);
    }
  }

  async AISpeech(text) {
    try {
      // Call ChatGPT API
      const textToSpeech = new TextToSpeechClient();
      const request = {
        input: { text },
        voice: {
          languageCode: 'fr-FR', // Change it to the language you want
          ssmlGender: 'NEUTRAL' // Gender
        },
        audioConfig: { audioEncoding: 'MP3' }
      };

      const [response] = await textToSpeech.synthesizeSpeech(request);

      fs.writeFileSync(
        path.join('.', 'tmp', 'output.mp3'),
        response.audioContent,
        'binary'
      );

      //const __filename = fileURLToPath(import.meta.url);
      //const __filename = 'file://' + path.join(__dirname, path.basename(__filename));
      //const __dirname = dirname(__filename);

      const resource = createAudioResource(
        join('..', '..', '..', 'tmp', 'output.mp3')
      );

      const player = createAudioPlayer();

      this.playerSubcription(player);

      const delay = performance.now() - (this.time || 0);
      const delaySeconds = delay / 1000;
      const delayRounded = delaySeconds.toFixed(2);
      console.log(`This took ${delayRounded}s 👺⌚`);

      // Start speaking
      this.connection.subscribe(player);
      player.play(resource);
    }
    catch (err) {
      console.log(err);
    }
  }

  playerSubcription(player) {
    player.on('error', (error) => {
      console.log('Error:', error.message);
      this.connection.destroy();
    });

    player.on(AudioPlayerStatus.Idle, () => {
      player.removeAllListeners();
    });
  }

  getOutputPath(buffers) {
    const concatenatedBuffer = Buffer.concat(buffers);
    const outputPath = path.join('.', 'tmp', 'input.pcm');
    fs.writeFileSync(outputPath, concatenatedBuffer);
    return outputPath;
  }
}

module.exports = VoiceTranscriptor;
