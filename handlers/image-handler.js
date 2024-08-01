import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

export default class ImageHandler {

    constructor(message,content){
        this.message = message;
        this.content = content;
    }

    async getImage(){
        let images = await this.getImages();
        if(images && images.length > 0){
            this.message.channel.sendTyping();
            this.content = this.cleanImagePathsFromResponse();
        }
        return true;
    }

    async getImages(){
        const imagesUrls = this.extractImages();
        const images = await this.downloadImages(imagesUrls);
        return images;
    }

    cleanImagePathsFromResponse() {
        const regex = /\[.*?\]\(https:\/\/oaidalleapiprodscus\.blob\.core\.windows\.net.*?\)/g;
        const matches = this.content.match(regex);
        if (!matches) return true;

        matches.forEach(match => {
            this.content = this.content.replace(match, '');
        });

        return true;
    }

    deleteImages(imagePaths) {
        imagePaths.forEach(imagePath => {
            if (fs.existsSync(imagePath)) {
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log('Image deleted:', imagePath);
                    }
                });
            }
        });
    }

    async downloadImages(images) {
        if (!images) return [];
        images = await Promise.all(images.map(async image => {
            console.log('Downloading images ' + image);
            const response = await fetch(image);
            const responseBuffer = await response.arrayBuffer();
            return this.saveImage(responseBuffer);
        }));
        console.log('Images downloaded',images);
        return images;
    }
    
    saveImage(response) {
        const _filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(_filename);
        const timestamp = new Date().getTime();
        const imageName = timestamp+'.jpg';
        const imageData = Buffer.from(response, 'binary');
        const imagePath = path.join(__dirname, './../tmp', imageName);
        
        console.log('Saving image to ' + imagePath);
        fs.writeFileSync(imagePath, imageData);
    
        return imagePath;
    }

    extractImages() {
        const imageRegex = /(?:(?:https?|ftp|file):\/\/|www\.|ftp\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/igm;
        const imageUrls = this.content.match(imageRegex);
        return imageUrls;
    }
    
}