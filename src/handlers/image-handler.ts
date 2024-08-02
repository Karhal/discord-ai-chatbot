import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

export default class ImageHandler {
  message: any;
  content: string;

  constructor(message: any, content: string) {
    this.message = message;
    this.content = content;
  }

  async getImage() {
    const images = await this.getImages();
    if (images && images.length > 0) {
      this.message.channel.sendTyping();
      this.cleanImagePathsFromResponse();
    }
    return true;
  }

  async getImages() {
    const imagesUrls = this.extractImages();
    if (!imagesUrls) return [];

    const images = await this.downloadImages(imagesUrls);
    return images;
  }

  cleanImagePathsFromResponse() {
    const regex =
      /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
    const matches = this.content.match(regex);
    if (!matches) return true;

    matches.forEach((match) => {
      this.content = this.content.replace(match, "");
    });

    return true;
  }

  async deleteImages(imagePaths: Array<string>) {
    imagePaths.forEach((imagePath) => {
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Image deleted:", imagePath);
          }
        });
      }
    });
  }

  async downloadImages(images: RegExpMatchArray) {
    if (!images) return [];
    const findImages = await Promise.all(
      images.map(async (image) => {
        console.log("Downloading images " + image);
        const response = await fetch(image);
        const responseBuffer = await response.arrayBuffer();
        return this.saveImage(responseBuffer);
      }),
    );
    console.log("Images downloaded", findImages);
    return findImages;
  }

  saveImage(response: ArrayBuffer) {
    const _filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(_filename);
    const timestamp = new Date().getTime();
    const imageName = timestamp + ".jpg";
    const imageData = Buffer.from(response);

    const pathTmpFolder = path.join(__dirname, "./../tmp");
    if (!fs.existsSync(pathTmpFolder)) {
      fs.mkdirSync(pathTmpFolder);
    }
    const imagePath = path.join(pathTmpFolder, imageName);

    console.log("Saving image to " + imagePath);
    fs.writeFileSync(imagePath, imageData);

    return imagePath;
  }

  extractImages() {
    const imageRegex =
      /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim;
    const imageUrls = this.content.match(imageRegex);
    return imageUrls;
  }
}
