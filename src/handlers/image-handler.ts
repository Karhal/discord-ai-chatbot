import path from 'path';
import fs from 'fs';
import FileHandler from './file-handler';

type ImageHandlerType = {
  message: string;
  handleMessageImages: () => Promise<string>;
  cleanImagePathsFromResponse: (content: string) => string;
  deleteImages: () => void;
};

export default class ImageHandler implements ImageHandlerType {
  imagesUrls: RegExpMatchArray | null = null;
  downloadedImages: string[] = [];
  message: string;
  imageRegex =
    /(?:\[(.*?)\]\((https?:\/\/(?:[^\/]*\.)?oaidalleapiprodscus[^)]*)\))|(?:!\[(.*?)\]\((https?:\/\/(?:[^\/]*\.)?oaidalleapiprodscus[^)]*)\))/g;

  constructor(message: string) {
    this.message = message;
  }

  async handleMessageImages(): Promise<string> {
    try {
      const imagesUrls = this.getExtractedImagesUrls(this.message);
      if (!imagesUrls.length) return this.message;

      this.downloadedImages = await this.downloadImages(imagesUrls);
      if (this.downloadedImages.length) {
        this.message = this.cleanImagePathsFromResponse(this.message);
      }

      return this.message;
    }
    catch (error) {
      console.error('Error handling message images:', {
        message: this.message,
        error
      });
      throw error;
    }
  }

  cleanImagePathsFromResponse(content: string): string {
    const matches = content.match(this.imageRegex);
    if (matches) {
      matches.forEach((match) => {
        content = content.replace(match, '').trim();
      });
    }
    return content;
  }

  public deleteImages(): void {
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

  private async downloadImages(images: string[]): Promise<string[]> {
    if (!images) return [];
    const findImagesWithNull: (string | null)[] = await Promise.all(
      images.map(async (image) => this.downloadImage(image))
    );

    const findImages = findImagesWithNull.filter((img) => img !== null);
    console.log('Images downloaded', findImages);
    return findImages;
  }

  private async downloadImage(image: string): Promise<string | null> {
    try {
      console.log('Downloading image:', image);
      const response = await fetch(image);
      return this.processImageResponse(response);
    }
    catch (error) {
      console.error('Error during image download:', error);
      return null;
    }
  }

  private async processImageResponse(
    response: Response
  ): Promise<string | null> {
    if (response.status === 200) {
      const responseBuffer = await response.arrayBuffer();
      return this.saveImage(responseBuffer);
    }
    else {
      console.error(
        'Error downloading image:',
        response.status,
        response.statusText
      );
      return null;
    }
  }

  private saveImage(response: ArrayBuffer): string {
    try {
      const imageName = this.generateImageName();
      const imageData = Buffer.from(response);

      const pathTmpFolder = FileHandler.createTmpFolder();
      const imagePath = path.join(pathTmpFolder, imageName);

      console.log('Saving image to ' + imagePath);
      fs.writeFileSync(imagePath, imageData);

      return imagePath;
    }
    catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }

  private generateImageName(): string {
    const timestamp = new Date().getTime();
    return `${timestamp}.jpg`;
  }

  private getExtractedImagesUrls(content: string): string[] {
    const imagesUrls = [...content.matchAll(this.imageRegex)].map(
      (match) => match[2] || match[4]
    );
    return imagesUrls || [];
  }
}
