import config from './config';

export interface ConfigType {
  discord: DiscordConfigType;
  openAI: OpenAIConfigType;
  dune: DuneConfigType;
  serp: SerpConfigType;
  braveSearch: BraveSearchConfigType;
  coin: CoinConfigType;
  googleSearch: GoogleSearchType;
}

export interface OpenAIConfigType {
  apiKey: string;
  model: string;
  prompt: string;
  summaryModel?: string;
  imageSize: string;
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
  google_domain: string;
}

export interface BraveSearchConfigType extends ActivatorConfigType {
  apiKey: string;
  lang: string;
}

export interface CoinConfigType extends ActivatorConfigType {
  apiKey: string;
  defaultAsset: string;
}

export interface GoogleSearchConfigType extends ActivatorConfigType {
  apiKey: string;
  cx: string;
}

export default class ConfigManager {
  private static _instance: ConfigManager;

  private openAIConfig: OpenAIConfigType = {
    apiKey: config.openAI.apiKey || process.env.OPENAI_API_KEY,
    model: config.openAI.model || process.env.OPENAI_MODEL || 'gpt-4o',
    summaryModel:
      config.openAI.summaryModel ||
      process.env.OPENAI_SUMMARY_MODEL ||
      'gpt-4o-mini',
    prompt:
      config.openAI.prompt ||
      process.env.OPENAI_PROMPT ||
      'You are a nice assistant in a discord server',
    imageSize: config.openAI.imageSize || process.env.IMAGE_SIZE || '1024x1024'
  };

  private discordConfig: DiscordConfigType = {
    token: config.discord.token || process.env.DISCORD_TOKEN || '',
    maxHistory:
      config.discord.maxHistory ||
      Number(process.env.DISCORD_MAX_HISTORY) ||
      10,
    lang: config.discord.lang || process.env.DISCORD_LANG || 'en'
  };

  private duneConfig: DuneConfigType = {
    active: config.dune.active || process.env.DUNE_ACTIVE || false,
    apiKey: config.dune.apiKey || process.env.DUNE_API_KEY
  };

  private serpConfig: SerpConfigType = {
    active: config.serp.active || process.env.SERP_ACTIVE || false,
    apiKey: config.serp.apiKey || process.env.SERP_API_KEY,
    google_domain:
      config.serp.google_domain || process.env.SERP_GOOGLE_DOMAIN || ''
  };

  private braveSearchConfig: BraveSearchConfigType = {
    active:
      config.braveSearch.active || process.env.BRAVE_SEARCH_ACTIVE || false,
    apiKey: config.braveSearch.apiKey || process.env.BRAVE_SEARCH_API_KEY
  };

  private coinConfig: CoinConfigType = {
    active: config.coin.active || process.env.COIN_ACTIVE || false,
    apiKey: config.coin.apiKey || process.env.COIN_API_KEY,
    defaultAsset:
      config.coin.defaultAsset || process.env.COIN_DEFAULT_ASSET || 'USD'
  };

  private googleSearchConfig: GoogleSearchConfigType = {
    active:
      config.googleSearch.active || process.env.GOOGLE_SEARCH_ACTIVE || false,
    apiKey: config.googleSearch.apiKey || process.env.GOOGLE_SEARCH_API_KEY,
    cx: config.googleSearch.cx || process.env.GOOGLE_SEARCH_CX
  };

  private config: ConfigType = {
    discord: this.discordConfig,
    openAI: this.openAIConfig,
    dune: this.duneConfig,
    serp: this.serpConfig,
    braveSearch: this.braveSearchConfig,
    coin: this.coinConfig,
    googleSearch: this.googleSearchConfig
  };

  private static getInstance() {
    if (this._instance) {
      return this._instance;
    }

    this._instance = new ConfigManager();
    console.log('Init config manager');
    this._instance.validateConfigIntegrity();

    return this._instance;
  }

  static getConfig() {
    return ConfigManager.getInstance().config;
  }

  private validateConfigIntegrity(): void {
    if (!this.config.discord.token) {
      throw new Error('No Discord token configured');
    }
    if (!this.config.openAI.apiKey) {
      throw new Error('No Open AI key configured');
    }
    if (this.config.dune?.active && !this.config.dune?.apiKey) {
      throw new Error('No Dune API key configured');
    }
    if (
      this.config.serp?.active &&
      (!this.config.serp?.apiKey || !this.config.serp?.google_domain)
    ) {
      throw new Error('No SERP API key or Google domain configured');
    }
    if (this.config.braveSearch?.active && !this.config.braveSearch?.apiKey) {
      throw new Error('No Brave Search API key configured');
    }
    if (this.config.coin?.active && !this.config.coin?.apiKey) {
      throw new Error('No Coin API key configured');
    }
    if (
      this.config.googleSearch?.active &&
      (!this.config.googleSearch?.apiKey || !this.config.googleSearch?.cx)
    ) {
      throw new Error('No GoogleSearch API key or CX configured');
    }
  }
}
