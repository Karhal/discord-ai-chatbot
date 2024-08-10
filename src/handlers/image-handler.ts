import path from 'path';
import fs from 'fs';

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
      images.map(async (image) => {
        try {
          console.log('Downloading image:', image);
          const response = await fetch(image);
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
        catch (error) {
          console.error('Error during image download:', error);
          return null;
        }
      })
    );

    const findImages = findImagesWithNull.filter((img) => img !== null);
    console.log('Images downloaded', findImages);
    return findImages;
  }

  private saveImage(response: ArrayBuffer) {
    try {
      const timestamp = new Date().getTime();
      const imageName = `${timestamp}.jpg`;
      const imageData = Buffer.from(response);

      const pathTmpFolder = path.join('.', '..', 'tmp');
      if (!fs.existsSync(pathTmpFolder)) {
        fs.mkdirSync(pathTmpFolder);
      }
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

  private getExtractedImagesUrls(content: string): string[] {
    const imagesUrls = [...content.matchAll(this.imageRegex)].map(
      (match) => match[2] || match[4]
    );
    return imagesUrls || [];
  }
}
