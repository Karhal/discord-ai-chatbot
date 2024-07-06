let audioConnection = null;

function setAudioConnection(connection) {
    console.log('Setting audio connection');
    audioConnection = connection;
    /*audioConnection.receiver.speaking.on('start', (userId) => {
        console.log('User is speaking');
        const voiceTrascriptor = new VoiceTranscriptor(audioConnection);
        voiceTrascriptor.listen(userId);
      });*/
}

function getAudioConnection() {
    return audioConnection;
}

module.exports = {
    setAudioConnection,
    getAudioConnection,
};