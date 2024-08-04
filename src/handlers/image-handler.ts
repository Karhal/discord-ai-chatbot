import path from 'path';
import fs from 'fs';
import AIClient from '../clients/ai-client';
import { ConsoleLogger } from '../console-logger';

export default class ImageHandler {
  message: any;
  content: string;
  aiClient: AIClient;
  imagesUrls: RegExpMatchArray | null = null;
  downloadedImages: string[] = [];

  constructor(aiClient: AIClient, message: any, content: string) {
    this.aiClient = aiClient;
    this.message = message;
    this.content = content;
  }

  async getImageFromMSG(): Promise<boolean> {
    const find = await this.getImages();
    if (find) {
      this.cleanImagePathsFromResponse();
      return true;
    }
    return false;
  }

  async getImages() {
    this.extractImages();
    if (!this.imagesUrls?.length) return [];

    this.downloadedImages = await this.downloadImages(this.imagesUrls);
    ConsoleLogger.log('VERBOSE', 'downloaded images', this.downloadedImages);
    if (this.downloadedImages.length) {
      return true;
    }
    return false;
  }

  cleanImagePathsFromResponse() {
    const regex =
      /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
    const matches = this.content.match(regex);
    if (!matches) return true;

    matches.forEach((match) => {
      this.content = this.content.replace(match, '');
    });
    return true;
  }

  async deleteImages() {
    this.downloadedImages.forEach((imagePath) => {
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(err);
          }
          else {
            ConsoleLogger.log('VERBOSE', 'Image deleted:', imagePath);
          }
        });
      }
    });
  }

  async downloadImages(images: RegExpMatchArray) {
    if (!images) return [];
    const findImages = await Promise.all(
      images
        .map(async (image) => {
          ConsoleLogger.log('VERBOSE', 'Downloading images ' + image);
          this.message.channel.sendTyping();
          const response = await fetch(image);
          if (response.status === 200) {
            const responseBuffer = await response.arrayBuffer();
            return this.saveImage(responseBuffer);
          }
          else {
            ConsoleLogger.log(
              'ERROR',
              'error download image',
              response.status,
              response.statusText
            );
            return null;
          }
        })
        .filter((img) => img !== null)
    );
    ConsoleLogger.log('CALL', 'Images downloaded', findImages);
    return findImages;
  }

  saveImage(response: ArrayBuffer) {
    const timestamp = new Date().getTime();
    const imageName = timestamp + '.jpg';
    const imageData = Buffer.from(response);

    const pathTmpFolder = './../tmp';
    if (!fs.existsSync(pathTmpFolder)) {
      fs.mkdirSync(pathTmpFolder);
    }
    const imagePath = path.join(pathTmpFolder, imageName);

    ConsoleLogger.log('VERBOSE', 'Saving image to ' + imagePath);
    fs.writeFileSync(imagePath, imageData);

    return imagePath;
  }

  extractImages() {
    const imageRegex =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
    this.imagesUrls = this.content.match(imageRegex);
    ConsoleLogger.log('VERBOSE', 'image extract', this.imagesUrls);
  }
}
