import configValues from './config';

export interface ConfigType {
  discord: DiscordConfigType;
  openAI: OpenAIConfigType;
  dune: DuneConfigType;
  serp: SerpConfigType;
  braveSearch: BraveSearchConfigType;
  coin: CoinConfigType;
  suno: SunoConfigType;
  googleLighthouse: LighthouseConfigType;
  googleSearch: GoogleSearchConfigType;
  backupFile: BackupFileConfigType;
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

export interface BackupFileConfigType {
  path: string;
  active: boolean;
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

export interface SunoConfigType extends ActivatorConfigType {
  cookieKey: string;
  maxByDay: number;
}

export interface LighthouseConfigType extends ActivatorConfigType {
  apiKey: string;
}

export interface GoogleSearchConfigType extends ActivatorConfigType {
  apiKey: string;
  cx: string;
}

export default class ConfigManager {
  static get config() {
    return ConfigManager.getConfig();
  }

  private static _instance: ConfigManager;

  private openAIConfig: OpenAIConfigType = {
    apiKey: configValues.openAI.apiKey || process.env.OPENAI_API_KEY,
    model: configValues.openAI.model || process.env.OPENAI_MODEL || 'gpt-4o',
    summaryModel:
      configValues.openAI.summaryModel ||
      process.env.OPENAI_SUMMARY_MODEL ||
      'gpt-4o-mini',
    prompt:
      configValues.openAI.prompt ||
      process.env.OPENAI_PROMPT ||
      'You are a nice assistant in a discord server',
    imageSize:
      configValues.openAI.imageSize || process.env.IMAGE_SIZE || '1024x1024'
  };

  private discordConfig: DiscordConfigType = {
    token: configValues.discord.token || process.env.DISCORD_TOKEN || '',
    maxHistory:
      configValues.discord.maxHistory ||
      Number(process.env.DISCORD_MAX_HISTORY) ||
      10,
    lang: configValues.discord.lang || process.env.DISCORD_LANG || 'en'
  };

  private backupFileConfig: BackupFileConfigType = {
    path: configValues.backupFile.path,
    active: configValues.backupFile.active
  };

  private duneConfig: DuneConfigType = {
    active: configValues.dune.active || process.env.DUNE_ACTIVE || false,
    apiKey: configValues.dune.apiKey || process.env.DUNE_API_KEY
  };

  private serpConfig: SerpConfigType = {
    active: configValues.serp.active || process.env.SERP_ACTIVE || false,
    apiKey: configValues.serp.apiKey || process.env.SERP_API_KEY,
    lang: configValues.serp.lang || process.env.SERP_LANG || 'en',
    google_domain:
      configValues.serp.google_domain || process.env.SERP_GOOGLE_DOMAIN || '',
    hl: configValues.serp.hl || process.env.SERP_HL || '',
    gl: configValues.serp.gl || process.env.SERP_GL || ''
  };

  private braveSearchConfig: BraveSearchConfigType = {
    active:
      configValues.braveSearch.active ||
      process.env.BRAVE_SEARCH_ACTIVE ||
      false,
    apiKey: configValues.braveSearch.apiKey || process.env.BRAVE_SEARCH_API_KEY,
    lang: configValues.braveSearch.lang || process.env.BRAVE_SEARCH_LANG || 'en'
  };

  private coinConfig: CoinConfigType = {
    active: configValues.coin.active || process.env.COIN_ACTIVE || false,
    apiKey: configValues.coin.apiKey || process.env.COIN_API_KEY,
    defaultAsset:
      configValues.coin.defaultAsset || process.env.COIN_DEFAULT_ASSET || 'USD'
  };

  private sunoConfig: SunoConfigType = {
    active: configValues.suno.active || process.env.SUNO_ACTIVE || false,
    cookieKey: configValues.suno.cookieKey || process.env.SUNO_COOKIE_KEY,
    maxByDay: parseInt(
      (
        configValues?.suno?.maxByDay ||
        process.env.SUNO_MAX_BY_DAY ||
        8
      ).toString()
    )
  };

  private lighthouseConfig: LighthouseConfigType = {
    active:
      configValues.googleLighthouse.active ||
      process.env.LIGHTHOUSE_ACTIVE ||
      false,
    apiKey:
      configValues.googleLighthouse.apiKey || process.env.LIGHTHOUSE_API_KEY
  };

  private googleSearchConfig: GoogleSearchConfigType = {
    active:
      configValues.googleSearch.active ||
      process.env.GOOGLE_SEARCH_ACTIVE ||
      false,
    apiKey:
      configValues.googleSearch.apiKey || process.env.GOOGLE_SEARCH_API_KEY,
    cx: configValues.googleSearch.cx || process.env.GOOGLE_SEARCH_CX
  };

  private _config: ConfigType = {
    discord: this.discordConfig,
    openAI: this.openAIConfig,
    dune: this.duneConfig,
    serp: this.serpConfig,
    braveSearch: this.braveSearchConfig,
    coin: this.coinConfig,
    suno: this.sunoConfig,
    googleSearch: this.googleSearchConfig,
    googleLighthouse: this.lighthouseConfig,
    backupFile: this.backupFileConfig
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
    return ConfigManager.getInstance()._config;
  }

  private validateConfigIntegrity(): void {
    if (!this._config.discord.token) {
      throw new Error('No Discord token configured');
    }
    if (!this._config.openAI.apiKey) {
      throw new Error('No Open AI key configured');
    }
    if (this._config.dune?.active && !this._config.dune?.apiKey) {
      throw new Error('No Dune API key configured');
    }
    if (
      this._config.serp?.active &&
      (!this._config.serp?.apiKey || !this._config.serp?.google_domain)
    ) {
      throw new Error('No SERP API key or Google domain configured');
    }
    if (this._config.braveSearch?.active && !this._config.braveSearch?.apiKey) {
      throw new Error('No Brave Search API key configured');
    }
    if (this._config.coin?.active && !this._config.coin?.apiKey) {
      throw new Error('No Coin API key configured');
    }

    if (this._config.suno?.active && !this._config.suno?.cookieKey) {
      throw new Error('No Suno cookie key configured');
    }
    if (
      this._config.googleLighthouse?.active &&
      !this._config.googleLighthouse?.apiKey
    ) {
      throw new Error('No Lighthouse API key configured');
    }
    if (
      this._config.googleSearch?.active &&
      (!this._config.googleSearch?.apiKey || !this._config.googleSearch?.cx)
    ) {
      throw new Error('No GoogleSearch API key or CX configured');
    }
    if (this._config.backupFile.active && !this._config.backupFile.path) {
      throw new Error('No backup folder configured');
    }
  }
}
