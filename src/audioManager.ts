class AudioManager {
  audioConnection = null;
  constructor() {}

  setAudioConnection(connection) {
    console.log('Setting audio connection');
    this.audioConnection = connection;
    /*this.audioConnection.receiver.speaking.on('start', (userId) => {
        console.log('User is speaking');
        const voiceTranscriptor = new VoiceTranscriptor(this.audioConnection);
        voiceTranscriptor.listen(userId);
      });*/
  }

  getAudioConnection() {
    return this.audioConnection;
  }
}

export default new AudioManager();
