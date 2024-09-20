//import configValues from './config';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
const fileContents = fs.readFileSync('./src/config.yaml', 'utf8');
const configValues = yaml.load(fileContents) as any;
console.log(configValues);
export interface ConfigType {
  aiClient: string;
  discord: DiscordConfigType;
  openAI: OpenAIClientConfigType;
  dallE: DallEConfigType;
  AIPrompt: string;
  claude: ClaudeClientConfigType;
  dune: DuneConfigType;
  giphy: GiphyConfigType;
  serp: SerpConfigType;
  braveSearch: BraveSearchConfigType;
  coin: CoinConfigType;
  googleLighthouse: LighthouseConfigType;
  googleSearch: GoogleSearchConfigType;
  fluxApi: FluxApiConfigType;
  tmpFolder: TmpFolderConfigType;
  stability: StabilityConfigType;
  triggerWords: string[];
  imageToVideo: ImageToVideoConfigType;
}

export interface OpenAIClientConfigType {
  apiKey: string;
  model: string;
  summaryModel: string;
  temperature: number;
  maxTokens: number;
}
export interface ClaudeClientConfigType {
  apiKey: string;
  model: string;
  summaryModel: string;
  temperature: number;
  maxTokens: number;
}

export interface DiscordConfigType {
  token: string;
  maxHistory: number;
  lang: string;
}

export interface ActivatorConfigType {
  active: boolean;
}

export interface DuneConfigType extends ActivatorConfigType {
  apiKey: string;
}

export interface SerpConfigType extends ActivatorConfigType {
  apiKey: string;
  lang: string;
  google_domain: string;
  hl: string;
  gl: string;
}

export interface BraveSearchConfigType extends ActivatorConfigType {
  apiKey: string;
  lang: string;
}

export interface CoinConfigType extends ActivatorConfigType {
  apiKey: string;
  defaultAsset: string;
}

export interface LighthouseConfigType extends ActivatorConfigType {
  apiKey: string;
}

export interface FluxApiConfigType extends ActivatorConfigType {
  apiKey: string;
}
export interface DallEConfigType extends ActivatorConfigType {
  apiKey: string;
  imageSize: string;
}
export interface GoogleSearchConfigType extends ActivatorConfigType {
  apiKey: string;
  cx: string;
}

export interface TmpFolderConfigType extends ActivatorConfigType {
  path: string;
}

export interface StabilityConfigType extends ActivatorConfigType {
  apiKey: string;
}

export interface GiphyConfigType extends ActivatorConfigType {
  apiKey: string;
}

export interface ImageToVideoConfigType extends ActivatorConfigType {
  apiKey: string;
}

export default class ConfigManager {
  static get config() {
    return ConfigManager.getConfig();
  }

  private static _instance: ConfigManager;

  private AIPrompt: string =
    configValues.AIPrompt || process.env.AI_PROMPT || 'You are a nice assistant in a discord server';

  private triggerWords: string[] =
    configValues.triggerWords || (process.env.TRIGGER_WORDS ? process.env.TRIGGER_WORDS.split(',') : []);

  private dallEConfig: DallEConfigType = {
    active: configValues.dallE.active || process.env.DALLE_ACTIVE === 'true' || false,
    apiKey: configValues.dallE.apiKey || process.env.DALLE_API_KEY || '',
    imageSize: configValues.dallE.imageSize || process.env.IMAGE_SIZE || '1024x1024'
  };

  private stabilityConfig: StabilityConfigType = {
    active: configValues.stability.active || process.env.STABILITY_ACTIVE === 'true' || false,
    apiKey: configValues.stability.apiKey || process.env.STABILITY_API_KEY || ''
  };

  private giphyConfig: GiphyConfigType = {
    active: configValues.giphy.active || process.env.GIPHY_ACTIVE === 'true' || false,
    apiKey: configValues.giphy.apiKey || process.env.GIPHY_API_KEY || ''
  };

  private openAIConfig: OpenAIClientConfigType = {
    apiKey: configValues.openAI.apiKey || process.env.OPENAI_API_KEY || '',
    model: configValues.openAI.model || process.env.OPENAI_MODEL || 'gpt-4o',
    summaryModel: configValues.openAI.summaryModel || process.env.OPENAI_SUMMARY_MODEL || 'gpt-4o-mini',
    maxTokens:
      configValues.openAI.maxTokens || (process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS) : 2000),
    temperature:
      configValues.openAI.temperature ||
      (process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : 0.5)
  };

  private claudeConfig: ClaudeClientConfigType = {
    apiKey: configValues.claude.apiKey || process.env.CLAUDE_API_KEY || '',
    model: configValues.claude.model || process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20240620',
    summaryModel: configValues.claude.summaryModel || process.env.CLAUDE_SUMMARY_MODEL || 'claude-3-haiku-20240307',
    maxTokens:
      configValues.claude.maxTokens || (process.env.CLAUDE_MAX_TOKENS ? parseInt(process.env.CLAUDE_MAX_TOKENS) : 2000),
    temperature:
      configValues.claude.temperature ||
      (process.env.CLAUDE_TEMPERATURE ? parseFloat(process.env.CLAUDE_TEMPERATURE) : 0.5)
  };

  private discordConfig: DiscordConfigType = {
    token: configValues.discord.token || process.env.DISCORD_TOKEN || '',
    maxHistory: configValues.discord.maxHistory || Number(process.env.DISCORD_MAX_HISTORY) || 10,
    lang: configValues.discord.lang || process.env.DISCORD_LANG || 'en'
  };

  private duneConfig: DuneConfigType = {
    active: configValues.dune.active || process.env.DUNE_ACTIVE === 'true' || false,
    apiKey: configValues.dune.apiKey || process.env.DUNE_API_KEY || ''
  };

  private serpConfig: SerpConfigType = {
    active: configValues.serp.active || process.env.SERP_ACTIVE === 'true' || false,
    apiKey: configValues.serp.apiKey ?? process.env.SERP_API_KEY ?? '',
    lang: configValues.serp.lang || process.env.SERP_LANG || 'en',
    google_domain: configValues.serp.google_domain || process.env.SERP_GOOGLE_DOMAIN || '',
    hl: configValues.serp.hl || process.env.SERP_HL || '',
    gl: configValues.serp.gl || process.env.SERP_GL || ''
  };

  private braveSearchConfig: BraveSearchConfigType = {
    active: configValues.braveSearch.active || process.env.BRAVE_SEARCH_ACTIVE === 'true' || false,
    apiKey: configValues.braveSearch.apiKey ?? process.env.BRAVE_SEARCH_API_KEY ?? '',
    lang: configValues.braveSearch.lang || process.env.BRAVE_SEARCH_LANG || 'en'
  };

  private coinConfig: CoinConfigType = {
    active: configValues.coin.active || process.env.COIN_ACTIVE === 'true' || false,
    apiKey: configValues.coin.apiKey ?? process.env.COIN_API_KEY ?? '',
    defaultAsset: configValues.coin.defaultAsset || process.env.COIN_DEFAULT_ASSET || 'USD'
  };

  private tmpFolderConfig: TmpFolderConfigType = {
    active: true,
    path: configValues.tmpFolder.path || process.env.TMP_FOLDER_PATH || 'tmp'
  };

  private lighthouseConfig: LighthouseConfigType = {
    active: configValues.googleLighthouse.active || process.env.LIGHTHOUSE_ACTIVE === 'false' || false,
    apiKey: configValues.googleLighthouse.apiKey ?? process.env.LIGHTHOUSE_API_KEY ?? ''
  };

  private googleSearchConfig: GoogleSearchConfigType = {
    active: configValues.googleSearch.active || process.env.GOOGLE_SEARCH_ACTIVE === 'false' || false,
    apiKey: configValues.googleSearch.apiKey ?? process.env.GOOGLE_SEARCH_API_KEY ?? '',
    cx: configValues.googleSearch.cx ?? process.env.GOOGLE_SEARCH_CX ?? ''
  };

  private fluxApiConfig: FluxApiConfigType = {
    active: configValues.fluxApi.active || process.env.FLUX_API_ACTIVE === 'true' || false,
    apiKey: configValues.fluxApi.apiKey ?? process.env.FLUX_API_KEY ?? ''
  };

  private imageToVideoConfig: ImageToVideoConfigType = {
    active: configValues.imageToVideo.active || process.env.IMAGE_TO_VIDEO_ACTIVE === 'true' || false,
    apiKey: configValues.imageToVideo.apiKey || process.env.IMAGE_TO_VIDEO_API_KEY || ''
  };

  private _config: ConfigType = {
    aiClient: configValues.aiClient || process.env.AI_CLIENT || 'openAI',
    discord: this.discordConfig,
    openAI: this.openAIConfig,
    claude: this.claudeConfig,
    AIPrompt: this.AIPrompt,
    dune: this.duneConfig,
    giphy: this.giphyConfig,
    serp: this.serpConfig,
    braveSearch: this.braveSearchConfig,
    coin: this.coinConfig,
    googleSearch: this.googleSearchConfig,
    googleLighthouse: this.lighthouseConfig,
    fluxApi: this.fluxApiConfig,
    dallE: this.dallEConfig,
    tmpFolder: this.tmpFolderConfig,
    stability: this.stabilityConfig,
    triggerWords: this.triggerWords,
    imageToVideo: this.imageToVideoConfig
  };

  private static getInstance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new ConfigManager();
    this._instance.validateConfigIntegrity();

    return this._instance;
  }

  static getConfig() {
    return ConfigManager.getInstance()._config;
  }

  private validateConfigIntegrity(): void {
    if (!this._config.AIPrompt) {
      throw new Error('No Ai Prompt configured');
    }
    if (!this._config.aiClient) {
      throw new Error('No Ai Client configured');
    }
    if (!this._config.discord.token) {
      throw new Error('No Discord token configured');
    }
    if (!this._config.openAI.apiKey) {
      throw new Error('No Open AI key configured');
    }
    if (this._config.dune?.active && !this._config.dune?.apiKey) {
      throw new Error('No Dune API key configured');
    }
    if (this._config.serp?.active && (!this._config.serp?.apiKey || !this._config.serp?.google_domain)) {
      throw new Error('No SERP API key or Google domain configured');
    }
    if (this._config.braveSearch?.active && !this._config.braveSearch?.apiKey) {
      throw new Error('No Brave Search API key configured');
    }
    if (this._config.coin?.active && !this._config.coin?.apiKey) {
      throw new Error('No Coin API key configured');
    }
    if (this._config.googleLighthouse?.active && !this._config.googleLighthouse?.apiKey) {
      throw new Error('No Lighthouse API key configured');
    }
    if (this._config.googleSearch?.active && (!this._config.googleSearch?.apiKey || !this._config.googleSearch?.cx)) {
      throw new Error('No GoogleSearch API key or CX configured');
    }
    if (this._config.fluxApi?.active && !this._config.fluxApi?.apiKey) {
      throw new Error('No Flux API key configured');
    }
    if (this._config.dallE?.active && !this._config.dallE?.apiKey) {
      throw new Error('No DallE API key configured');
    }
    if (this._config.stability?.active && !this._config.stability?.apiKey) {
      throw new Error('No Stability API key configured');
    }
    if (this._config.giphy?.active && !this._config.giphy?.apiKey) {
      throw new Error('No Giphy API key configured');
    }
    if (this._config.imageToVideo?.active && !this._config.imageToVideo?.apiKey) {
      throw new Error('No Image to Video API key configured');
    }
  }
}
