import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';
import FileHandler from '../handlers/file-handler';
import sharp from 'sharp';
import fs from 'fs/promises';

export default class ImageToVideoTool extends AbstractTool {
  readonly toolName = ImageToVideoTool.name;
  public isActivated = ConfigManager.config.imageToVideo.active;
  private imageToVideoConfig = ConfigManager.config.imageToVideo;
  private apiKey: string;

  constructor() {
    super();
    this.apiKey = this.imageToVideoConfig.apiKey;
  }

  readonly description =
    'Use this tool when the user asks to create a video from an image. ' +
    'It generates a video based on the provided image.';

  readonly parameters = {
    type: 'object',
    properties: {
      imagePath: {
        type: 'string',
        description: 'The URL of the image to convert to video. get it from the messages history. '
      }
    },
    required: ['imagePath']
  };

  private async downloadImage(url: string): Promise<string> {
    console.log(url);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const timestamp = Date.now();
    const filename = `downloaded_image_${timestamp}.png`;
    const filePath = FileHandler.saveArrayBufferToFile(
      ConfigManager.config.tmpFolder.path,
      filename,
      Buffer.from(buffer)
    );
    return filePath;
  }

  private async checkVideoStatus(generationId: string): Promise<Buffer | null> {
    const maxAttempts = 30;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`https://api.stability.ai/v2beta/image-to-video/result/${generationId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'video/*'
          }
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.startsWith('video/')) {
            return Buffer.from(await response.arrayBuffer());
          }
        }

        await new Promise(resolve => setTimeout(resolve, 10000));
        attempts++;
      }
      catch (error) {
        console.error('Error checking video status:', error);
        throw error;
      }
    }

    throw new Error('Video generation timed out');
  }

  async generateVideo(imagePath: string): Promise<string> {
    let localImagePath: string | null = null;
    try {
      localImagePath = imagePath.startsWith('http') ? await this.downloadImage(imagePath) : imagePath;
      console.log('Local image path:', localImagePath);

      let imageBuffer: Buffer;
      let fileExtension: string;

      try {
        const buffer = await FileHandler.readFileAsBuffer(localImagePath);
        if (!buffer) {
          throw new Error('Failed to read image file');
        }
        const image = sharp(buffer);
        const metadata = await image.metadata();
        image.resize(1024, 576, { fit: 'cover' });

        if (metadata.format && ['png', 'jpeg', 'jpg'].includes(metadata.format)) {
          imageBuffer = await image.toBuffer();
          fileExtension = metadata.format === 'jpeg' ? 'jpg' : metadata.format;
        }
        else {
          imageBuffer = await image.png().toBuffer();
          fileExtension = 'png';
        }
      }
      catch (error) {
        console.error('Error processing image:', error);
        throw new Error('Failed to process image file');
      }

      const videoPath = await this.processVideoGeneration(imageBuffer, fileExtension);
      return videoPath;
    }
    finally {
      if (localImagePath && localImagePath !== imagePath) {
        try {
          await fs.unlink(localImagePath);
          console.log('Deleted temporary image:', localImagePath);
        }
        catch (error) {
          console.error('Error deleting temporary image:', error);
        }
      }
    }
  }

  private async processVideoGeneration(imageBuffer: Buffer, fileExtension: string): Promise<string> {
    const formData = new FormData();
    const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

    formData.append('image', new Blob([imageBuffer], { type: mimeType }), `image.${fileExtension}`);
    formData.append('seed', '0');
    formData.append('cfg_scale', '1.8');
    formData.append('motion_bucket_id', '127');

    try {
      const response = await fetch('https://api.stability.ai/v2beta/image-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const generationId = data.id;

        const videoBuffer = await this.checkVideoStatus(generationId);

        if (videoBuffer) {
          const videoFileName = `generated_video_${generationId}.mp4`;
          const videoPath = FileHandler.saveArrayBufferToFile(
            ConfigManager.config.tmpFolder.path,
            videoFileName,
            videoBuffer
          );

          return videoPath;
        }
        else {
          throw new Error('Failed to generate video');
        }
      }
      else {
        throw new Error(`Error: ${response.status} - ${await response.text()}`);
      }
    }
    catch (error) {
      console.error('Error generating video:', error);
      throw error;
    }
  }

  readonly execute = async (paramsAsString: string) => {
    try {
      const params = JSON.parse(paramsAsString);
      const videoPath = await this.generateVideo(params.imagePath);
      return JSON.stringify({
        video_path: videoPath,
        info: 'Video generation completed. The video has been saved.'
      });
    }
    catch (error: unknown) {
      console.error(error);
      return JSON.stringify({ error: 'An unexpected error occurred during video generation' });
    }
  };
}