import path from 'path';
import fs from 'fs';
import AIClient from '../clients/ai-client';
import { Message } from 'discord.js';

type ImageHandlerType = {
  content: string;
  message: Message;
  getImageFromMSG: () => Promise<boolean>;
  getImages: () => Promise<boolean>;
};

export default class ImageHandler implements ImageHandlerType {
  message: Message;
  content: string;
  aiClient: AIClient;
  imagesUrls: RegExpMatchArray | null = null;
  downloadedImages: string[] = [];

  constructor(aiClient: AIClient, message: Message, content: string) {
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

  async getImages(): Promise<boolean> {
    this.extractImages();
    if (!this.imagesUrls?.length) return false;

    this.downloadedImages = await this.downloadImages(this.imagesUrls);
    console.log('downloaded images', this.downloadedImages);
    if (this.downloadedImages.length) {
      return true;
    }
    return false;
  }

  cleanImagePathsFromResponse(): void {
    console.log('before', this.content);
    const regex =
      /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
    const matches = this.content.match(regex);
    if (matches) {
      matches.forEach((match) => {
        this.content = this.content.replace(match, '');
      });
    }
    console.log('after', this.content);
  }

  deleteImages(): void {
    this.downloadedImages.forEach((imagePath) => {
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(err);
          }
          else {
            console.log('Image deleted:', imagePath);
          }
        });
      }
    });
  }

  async downloadImages(images: RegExpMatchArray): Promise<string[]> {
    if (!images) return [];
    const findImagesWithNull: (string | null)[] = await Promise.all(
      images.map(async (image) => {
        console.log('Downloading images ' + image);
        this.message.channel.sendTyping();
        const response = await fetch(image);
        if (response.status === 200) {
          const responseBuffer = await response.arrayBuffer();
          return this.saveImage(responseBuffer);
        }
        else {
          console.log(
            'error download image',
            response.status,
            response.statusText
          );
          return null;
        }
      })
    );

    const findImages = findImagesWithNull.filter((img) => img !== null);
    console.log('Images downloaded', findImages);
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

    console.log('Saving image to ' + imagePath);
    fs.writeFileSync(imagePath, imageData);

    return imagePath;
  }

  extractImages() {
    const imageRegex =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$]?)/gim;
    this.imagesUrls = this.content.match(imageRegex);
    console.log('image extract', this.imagesUrls, this.content);
  }
}
