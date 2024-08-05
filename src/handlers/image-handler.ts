import path from 'path';
import fs from 'fs';

type ImageHandlerType = {
  message: string;
  getImages: (content: string) => Promise<Array<string>>;
  handleMessageImages: () => Promise<string>;
  cleanImagePathsFromResponse: (content: string) => string;
  deleteImages: () => void;
};

export default class ImageHandler implements ImageHandlerType {
  imagesUrls: RegExpMatchArray | null = null;
  downloadedImages: string[] = [];
  message: string;

  constructor(message: string) {
    this.message = message;
  }

  async handleMessageImages(): Promise<string> {
    const imagesUrls = this.getExtractedImagesUrls(this.message);
    if (!imagesUrls?.length) return this.message;

    this.downloadedImages = await this.downloadImages(imagesUrls);
    if (this.downloadedImages.length) {
      this.message = this.cleanImagePathsFromResponse(this.message);
    }

    return this.message;
  }

  async getImages(content: string): Promise<Array<string>> {
    const imagesUrls = this.getExtractedImagesUrls(content);
    if (!imagesUrls?.length) return [];

    this.downloadedImages = await this.downloadImages(imagesUrls);
    if (this.downloadedImages.length) {
      return imagesUrls;
    }
    return [];
  }

  cleanImagePathsFromResponse(content: string): string {
    const regex =
      /!?\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
    const matches = content.match(regex);
    if (matches) {
      matches.forEach((match) => {
        content = content.replace(match, '');
      });
    }
    return content;
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

  async downloadImages(images: string[]): Promise<string[]> {
    if (!images) return [];
    const findImagesWithNull: (string | null)[] = await Promise.all(
      images.map(async (image) => {
        console.log('Downloading images ' + image);
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

  getExtractedImagesUrls(content: string) {
    const imageRegex =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$]?)/gim;
    const imagesUrls = content.match(imageRegex);
    return imagesUrls;
  }
}
