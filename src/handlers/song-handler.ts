export default class SongHandler {
  static lastSong?: number;
  static songNumber = 0;
  songs: string[] = [];
  downloadedSongs: string[] = [];
  message: string;
  songRegex =
    /(?:\[(.*?)\]\((\.\.\/tmp\/[^)]*.mp3)\))|(?:!\[(.*?)\]\((\.\.\/tmp\/[^)]*.mp3))\)/g;

  constructor(message: string) {
    this.message = message;
  }

  async handleMessageSongs(): Promise<string> {
    try {
      this.extractSongUrls();
      if (!this.songs.length) return this.message;

      this.message = this.cleanSongPathsFromResponse();

      return this.message;
    }
    catch (error) {
      console.error('Error handling message song:', {
        message: this.message,
        error
      });
      throw error;
    }
  }

  cleanSongPathsFromResponse() {
    const matches = this.message.match(this.songRegex);
    if (matches) {
      matches.forEach((match) => {
        this.message = this.message.replace(match, '').trim();
      });
    }
    return this.message;
  }

  extractSongUrls(): void {
    const songUrls = [...this.message.matchAll(this.songRegex)].map(
      (match) => match[2] || match[4]
    );
    this.songs = songUrls || [];
  }
}
