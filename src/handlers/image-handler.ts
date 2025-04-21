import fs from 'fs';
import FileHandler from './file-handler';
import ConfigManager from '../configManager';

type ImageHandlerType = {
  deleteImages: () => void;
  downloadImages: (images: string[], channelId?: string) => Promise<string[]>;
  downloadImage: (image: string, channelId?: string) => Promise<string | null>;
};

export default class ImageHandler implements ImageHandlerType {
  downloadedImages: string[] = [];

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

  async downloadImages(images: string[], channelId?: string): Promise<string[]> {
    if (!images) return [];
    const findImagesWithNull: (string | null)[] = await Promise.all(
      images.map(async (image) => this.downloadImage(image, channelId))
    );

    const findImages = findImagesWithNull.filter((img) => img !== null);
    console.log('Images downloaded', findImages);
    return findImages;
  }

  public async downloadImage(image: string, channelId?: string): Promise<string | null> {
    try {
      console.log('Downloading image:', image);
      const response = await fetch(image);
      return this.processImageResponse(response, channelId);
    }
    catch (error) {
      console.error('Error during image download:', error);
      return null;
    }
  }

  public async processImageResponse(
    response: Response,
    channelId?: string
  ): Promise<string | null> {
    if (response.status === 200) {
      const responseBuffer = await response.arrayBuffer();
      return this.saveImage(responseBuffer, channelId);
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

  private saveImage(response: ArrayBuffer, channelId?: string): string {
    try {
      const imageName = this.generateImageName();
      const imageData = Buffer.from(response);

      // Determine the folder path based on channelId
      const folderPath = channelId
        ? `${ConfigManager.config.tmpFolder.path}/${channelId}`
        : ConfigManager.config.tmpFolder.path;

      // Ensure the folder exists
      FileHandler.createFolder(folderPath);

      const imagePath = FileHandler.saveArrayBufferToFile(
        folderPath,
        imageName,
        imageData
      );

      return imagePath;
    }
    catch (error) {
      console.error('Error saving image:', error);
      throw error;
    }
  }

  private generateImageName(format = 'jpg'): string {
    const timestamp = new Date().getTime();
    return `${timestamp}.${format}`;
  }

  public async saveBase64Image(base64Data: string, format: string, channelId?: string): Promise<string> {
    try {
      const buffer = Buffer.from(base64Data, 'base64');
      const imageName = this.generateImageName(format);

      // Determine the folder path based on channelId
      const folderPath = channelId
        ? `${ConfigManager.config.tmpFolder.path}/${channelId}`
        : ConfigManager.config.tmpFolder.path;

      // Ensure the folder exists
      FileHandler.createFolder(folderPath);

      const imagePath = FileHandler.saveArrayBufferToFile(
        folderPath,
        imageName,
        buffer
      );

      return imagePath;
    }
    catch (error) {
      console.error('Error saving base64 image:', error);
      throw error;
    }
  }

  public async getImageAsBase64(imagePath: string): Promise<string> {
    const imageData = fs.readFileSync(imagePath);
    return imageData.toString('base64');
  }
}
