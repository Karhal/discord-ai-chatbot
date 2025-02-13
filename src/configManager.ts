import * as yaml from 'js-yaml';
import * as fs from 'fs';
import path from 'path';

const fileContents = fs.readFileSync('./src/config.yaml', 'utf8');
const configValues = yaml.load(fileContents) as any;

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
  metrics: MetricsConfigType;
  youtubeTranscript: YoutubeTranscriptConfigType;
  puppeteer: PuppeteerConfigType;
  moderation: ModerationConfigType;
  tradingChart: TradingChartConfigType;
  twitter: TwitterConfigType;
}

export interface OpenAIClientConfigType {
  apiKey: string;
  model: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
}
export interface ClaudeClientConfigType {
  apiKey: string;
  model: string;
  fallbackModel: string;
  temperature: number;
  maxTokens: number;
}

export interface YoutubeTranscriptConfigType {
  active: boolean;
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

export interface TradingChartConfigType extends ActivatorConfigType {
  apiKey: string;
}

export interface MetricsConfigType {
  webhookUrl?: string;
}

export interface ModerationConfigType {
  enabled: boolean;
  bannedWords: string[];
  actions: {
    timeout: number;
    maxWarnings: number;
  };
  googleSafeBrowsingKey: string;
}

export interface TwitterConfigType extends ActivatorConfigType {
  bearerToken: string;
}

export type PuppeteerConfigType = ActivatorConfigType;

export default class ConfigManager {
  static get config() {
    return ConfigManager.getConfig();
  }

  private static _instance: ConfigManager;

  private AIPrompt: string =
    process.env.AI_PROMPT || configValues.AIPrompt || 'You are a nice assistant in a discord server';

  private triggerWords: string[] = (() => {
    if (process.env.TRIGGER_WORDS) {
      return process.env.TRIGGER_WORDS.split(',');
    }
    if (configValues.triggerWords && Array.isArray(configValues.triggerWords)) {
      return configValues.triggerWords;
    }
    console.warn('No trigger words defined. Using an empty array.');
    return [];
  })();

  private youtubeTranscriptConfig: YoutubeTranscriptConfigType = {
    active: process.env.YOUTUBE_TRANSCRIPT_ACTIVE === 'true' || configValues.youtubeTranscript?.active || false
  };

  private tradingChartConfig: TradingChartConfigType = {
    active: process.env.TRADING_CHART_ACTIVE === 'true' || configValues.tradingChart?.active || false,
    apiKey: process.env.TRADING_CHART_API_KEY || configValues.tradingChart?.apiKey || ''
  };

  private dallEConfig: DallEConfigType = {
    active: process.env.DALLE_ACTIVE === 'true' || configValues.dallE?.active || false,
    apiKey: process.env.DALLE_API_KEY || configValues.dallE?.apiKey || '',
    imageSize: process.env.IMAGE_SIZE || configValues.dallE?.imageSize || '1024x1024'
  };

  private stabilityConfig: StabilityConfigType = {
    active: process.env.STABILITY_ACTIVE === 'true' || configValues.stability?.active || false,
    apiKey: process.env.STABILITY_API_KEY || configValues.stability?.apiKey || ''
  };

  private giphyConfig: GiphyConfigType = {
    active: process.env.GIPHY_ACTIVE === 'true' || configValues.giphy?.active || false,
    apiKey: process.env.GIPHY_API_KEY || configValues.giphy?.apiKey || ''
  };

  private openAIConfig: OpenAIClientConfigType = {
    apiKey: process.env.OPENAI_API_KEY || configValues.openAI?.apiKey || '',
    model: process.env.OPENAI_MODEL || configValues.openAI?.model || 'gpt-4o',
    fallbackModel: process.env.OPENAI_FALLBACK_MODEL || configValues.openAI?.fallbackModel || 'gpt-3.5-turbo',
    maxTokens: process.env.OPENAI_MAX_TOKENS ? parseInt(process.env.OPENAI_MAX_TOKENS) : configValues.openAI?.maxTokens || 2000,
    temperature: process.env.OPENAI_TEMPERATURE ? parseFloat(process.env.OPENAI_TEMPERATURE) : configValues.openAI?.temperature || 0.5
  };

  private claudeConfig: ClaudeClientConfigType = {
    apiKey: process.env.CLAUDE_API_KEY || configValues.claude?.apiKey || '',
    model: process.env.CLAUDE_MODEL || configValues.claude?.model || 'claude-3-5-sonnet-20240620',
    fallbackModel: process.env.CLAUDE_FALLBACK_MODEL || configValues.claude?.fallbackModel || 'claude-3-haiku-20240307',
    maxTokens: process.env.CLAUDE_MAX_TOKENS ? parseInt(process.env.CLAUDE_MAX_TOKENS) : configValues.claude?.maxTokens || 2000,
    temperature: process.env.CLAUDE_TEMPERATURE ? parseFloat(process.env.CLAUDE_TEMPERATURE) : configValues.claude?.temperature || 0.5
  };

  private discordConfig: DiscordConfigType = {
    token: process.env.DISCORD_TOKEN || configValues.discord?.token || '',
    maxHistory: Number(process.env.DISCORD_MAX_HISTORY) || configValues.discord?.maxHistory || 10,
    lang: process.env.DISCORD_LANG || configValues.discord?.lang || 'en'
  };

  private duneConfig: DuneConfigType = {
    active: process.env.DUNE_ACTIVE === 'true' || configValues.dune?.active || false,
    apiKey: process.env.DUNE_API_KEY || configValues.dune?.apiKey || ''
  };

  private serpConfig: SerpConfigType = {
    active: process.env.SERP_ACTIVE === 'true' || configValues.serp?.active || false,
    apiKey: process.env.SERP_API_KEY || configValues.serp?.apiKey || '',
    lang: process.env.SERP_LANG || configValues.serp?.lang || 'en',
    google_domain: process.env.SERP_GOOGLE_DOMAIN || configValues.serp?.google_domain || '',
    hl: process.env.SERP_HL || configValues.serp?.hl || '',
    gl: process.env.SERP_GL || configValues.serp?.gl || ''
  };

  private braveSearchConfig: BraveSearchConfigType = {
    active: process.env.BRAVE_SEARCH_ACTIVE === 'true' || configValues.braveSearch?.active || false,
    apiKey: process.env.BRAVE_SEARCH_API_KEY || configValues.braveSearch?.apiKey || '',
    lang: process.env.BRAVE_SEARCH_LANG || configValues.braveSearch?.lang || 'en'
  };

  private coinConfig: CoinConfigType = {
    active: process.env.COIN_ACTIVE === 'true' || configValues.coin?.active || false,
    apiKey: process.env.COIN_API_KEY || configValues.coin?.apiKey || '',
    defaultAsset: process.env.COIN_DEFAULT_ASSET || configValues.coin?.defaultAsset || 'USD'
  };

  private tmpFolderConfig: TmpFolderConfigType = {
    active: true,
    path: process.env.TMP_FOLDER_PATH || configValues.tmpFolder?.path || 'tmp'
  };

  private lighthouseConfig: LighthouseConfigType = {
    active: process.env.LIGHTHOUSE_ACTIVE === 'true' || configValues.googleLighthouse?.active || false,
    apiKey: process.env.LIGHTHOUSE_API_KEY || configValues.googleLighthouse?.apiKey || ''
  };

  private googleSearchConfig: GoogleSearchConfigType = {
    active: process.env.GOOGLE_SEARCH_ACTIVE === 'true' || configValues.googleSearch?.active || false,
    apiKey: process.env.GOOGLE_SEARCH_API_KEY || configValues.googleSearch?.apiKey || '',
    cx: process.env.GOOGLE_SEARCH_CX || configValues.googleSearch?.cx || ''
  };

  private fluxApiConfig: FluxApiConfigType = {
    active: process.env.FLUX_API_ACTIVE === 'true' || configValues.fluxApi?.active || false,
    apiKey: process.env.FLUX_API_KEY || configValues.fluxApi?.apiKey || ''
  };

  private metricsConfig: MetricsConfigType = {
    webhookUrl: process.env.METRICS_WEBHOOK_URL || configValues.metrics?.webhookUrl || undefined
  };

  private moderationConfig: ModerationConfigType = {
    enabled: process.env.MODERATION_ENABLED === 'true' || configValues.moderation?.enabled || false,
    bannedWords: process.env.MODERATION_BANNED_WORDS ? process.env.MODERATION_BANNED_WORDS.split(',') : configValues.moderation?.bannedWords || [],
    actions: {
      timeout: process.env.MODERATION_TIMEOUT ? parseInt(process.env.MODERATION_TIMEOUT) : configValues.moderation?.actions?.timeout || 300000,
      maxWarnings: process.env.MODERATION_MAX_WARNINGS ? parseInt(process.env.MODERATION_MAX_WARNINGS) : configValues.moderation?.actions?.maxWarnings || 3
    },
    googleSafeBrowsingKey: process.env.GOOGLE_SAFE_BROWSING_KEY || configValues.moderation?.googleSafeBrowsingKey || ''
  };

  private twitterConfig: TwitterConfigType = {
    active: process.env.TWITTER_ACTIVE === 'true' || configValues.twitter?.active || false,
    bearerToken: process.env.TWITTER_BEARER_TOKEN || configValues.twitter?.bearerToken || ''
  };

  private _config: ConfigType = {
    aiClient: process.env.AI_CLIENT || configValues.aiClient || 'openAI',
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
    metrics: this.metricsConfig,
    youtubeTranscript: this.youtubeTranscriptConfig,
    puppeteer: {
      active: process.env.PUPPETEER_ACTIVE === 'true' || configValues.puppeteer?.active || true
    },
    moderation: this.moderationConfig,
    tradingChart: this.tradingChartConfig,
    twitter: this.twitterConfig
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
    /*console.log('Configuration:', configValues);*/
    console.log('Ai:', this._config.aiClient);

    console.log('Model:', this._config.aiClient === 'openAI' ? this._config.openAI.model : this._config.claude.model);
    console.log('fallbackModel:', this._config.aiClient === 'openAI' ? this._config.openAI.fallbackModel : this._config.claude.fallbackModel);
    console.log('triggerWords:', this.triggerWords);
    const tmpFolderPath = path.resolve(this._config.tmpFolder.path);
    try {
      fs.accessSync(tmpFolderPath, fs.constants.W_OK);
      console.log(`Temporary folder ${tmpFolderPath} is writable.`);
    }
    catch (err) {
      console.error(`Error: Temporary folder ${tmpFolderPath} is not writable.`);
      throw new Error(`Temporary folder ${tmpFolderPath} is not writable. Please check permissions.`);
    }

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
    if (this._config.tradingChart?.active && !this._config.tradingChart?.apiKey) {
      throw new Error('No Trading Chart API key configured');
    }

    if (this._config.twitter?.active && !this._config.twitter?.bearerToken) {
      throw new Error('No Twitter Bearer Token configured');
    }
  }
}
