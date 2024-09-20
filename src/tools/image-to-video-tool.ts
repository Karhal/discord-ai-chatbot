import AbstractTool from './absract-tool';
import ConfigManager from '../configManager';
import FileHandler from '../handlers/file-handler';

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
    const filename = 'downloaded_image.png';
    return FileHandler.saveArrayBufferToFile(
      ConfigManager.config.tmpFolder.path,
      filename,
      Buffer.from(buffer)
    );
  }

  async generateVideo(imagePath: string): Promise<string> {
    const localImagePath = imagePath.startsWith('http') ? await this.downloadImage(imagePath) : imagePath;
    console.log(localImagePath);
    const formData = new FormData();
    const imageContent = FileHandler.readFile('.', localImagePath);
    if (!imageContent) {
      throw new Error('Failed to read image file');
    }
    formData.append('image', new Blob([imageContent]), 'image.png');
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
        return data.id;
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
      const generationId = await this.generateVideo(params.imagePath);
      return JSON.stringify({
        video_generation_id: generationId,
        info: 'Video generation started. Use the ID to check the status.'
      });
    }
    catch (error: unknown) {
      console.error(error);
      return JSON.stringify({ error: 'An unexpected error occurred during video generation' });
    }
  };
}