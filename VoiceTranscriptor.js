
const pkg = require('@discordjs/opus');
const { OpusEncoder } = pkg;

const {
  AudioPlayerStatus,
  EndBehaviorType,
  createAudioResource,
  createAudioPlayer,
} = require('@discordjs/voice');

const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const { dirname, join } = require('path');
const { fileURLToPath } = require('url');

const REQUEST_CONFIG = {
    encoding: "LINEAR16",
    sampleRateHertz: 48000,
    languageCode: "en-US", // Change to the language you want
    audioChannelCount: 2,
  };


class VoiceTranscriptor {

    connection;
    receiver;
    speechClient = new SpeechClient();
    message;
    commandsChannel;
    time;
    messageId;

    constructor(connection) {
      this.connection = connection;
      this.receiver = this.connection.receiver;
    }
  
    async listen(userId) {
      try {
        console.log(`Listening to ${userId} 🦎`);
        this.dataSubscriptions(userId);
      } catch (error) {
        console.log(error);
      }
    }
  
    dataSubscriptions(userId) {
      let subscription = this.receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 100,
        },
      });
  
      const buffers = [];
      const encoder = new OpusEncoder(48000, 2);
  
      subscription.on('data', (chunk) => {
        console.log(buffers.length)
        buffers.push(encoder.decode(chunk));
      }); // Subscription on when we receive data
  
      
      subscription.once('end', async () => {
        if (buffers.length < 70) {
          return console.log('Audio is too short')
        }
        this.time = performance.now();
  
        const outputPath = this.getOutputPath(buffers);
        const transcription = await this.getTranscription(outputPath);
        console.log(transcription);
  
        if (transcription.length > 5) return this.AISpeech(transcription); // The transcription has a minimum of 5 letters
      }); // Subscription on when user stops talking
    }
  
    async getTranscription(tempFileName) {

      try {
        const bytes = fs.readFileSync(tempFileName).toString('base64');
        const request = {
          audio: {
            content: bytes,
          },
          config: REQUEST_CONFIG,
        };
  
        const [response] = await this.speechClient.recognize(request);
        if (response && response.results) {
          const transcription = response.results
            .map((result) => {
              if (result.alternatives) return result.alternatives[0].transcript;
              else {
                console.log(result);
                throw Error('No alternatives');
              }
            })
            .join('\n');
  
          return transcription.toLowerCase();
        } else {
          console.log(response);
          throw Error('No response or response results');
        }
      } catch (error) {
        console.log(error);
      }
    }
  
    /*async AISpeech(transcription) {
      try {
        // Call ChatGPT API
        const text = await talkToAI(transcription);
        const textToSpeech = new TextToSpeechClient();
        const request = {
          input: { text },
          voice: {
            languageCode: 'en-US', // Change it to the language you want
            ssmlGender: 'NEUTRAL', // Gender
          },
          audioConfig: { audioEncoding: 'MP3' },
        };
  
        const [response] = await textToSpeech.synthesizeSpeech(request);
  
        fs.writeFileSync('./assets/output.mp3', response.audioContent, 'binary');
  
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
  
        const resource = createAudioResource(
          join(__dirname, '../../../assets/output.mp3')
        );
  
        const player = createAudioPlayer();
  
        this.playerSubcription(player);
  
        const delay = performance.now() - (this.time || 0);
        const delaySeconds = delay / 1000;
        const delayRounded = delaySeconds.toFixed(2);
        console.log(`This took ${delayRounded}s 👺⌚`)
  
        // Start speaking
        this.connection.subscribe(player);
        player.play(resource);
      } catch (err) {
        console.log(err);
      }
    }*/
  
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
      const outputPath = './tmp/input.pcm';
      fs.writeFileSync(outputPath, concatenatedBuffer);
      return outputPath;
    }
  }

module.exports = VoiceTranscriptor;