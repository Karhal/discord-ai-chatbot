import configValues from './config';

export interface ConfigType {
  aiClient: string;
  discord: DiscordConfigType;
  openAI: AiClientConfigType;
  AIPrompt: string;
  claude: AiClientConfigType;
  mistral: AiClientConfigType;
  dune: DuneConfigType;
  serp: SerpConfigType;
  braveSearch: BraveSearchConfigType;
  coin: CoinConfigType;
  googleLighthouse: LighthouseConfigType;
  googleSearch: GoogleSearchConfigType;
  tmpFolder: TmpFolderConfigType;
}

export interface AiClientConfigType {
  apiKey: string;
  model: string;
  summaryModel: string;
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

export interface GoogleSearchConfigType extends ActivatorConfigType {
  apiKey: string;
  cx: string;
}

export interface TmpFolderConfigType extends ActivatorConfigType {
  path: string;
}

export default class ConfigManager {
  static get config() {
    return ConfigManager.getConfig();
  }

  private static _instance: ConfigManager;

  private AIPrompt: string =
    configValues.AIPrompt ||
    process.env.AI_PROMPT ||
    'You are a nice assistant in a discord server';

  private openAIConfig: AiClientConfigType = {
    apiKey: configValues.openAI.apiKey || process.env.OPENAI_API_KEY,
    model: configValues.openAI.model || process.env.OPENAI_MODEL || 'gpt-4o',
    summaryModel:
      configValues.openAI.summaryModel ||
      process.env.OPENAI_SUMMARY_MODEL ||
      'gpt-4o-mini',
    imageSize:
      configValues.openAI.imageSize || process.env.IMAGE_SIZE || '1024x1024'
  };

  private claudeConfig: AiClientConfigType = {
    apiKey: configValues.claude.apiKey || process.env.OPENAI_API_KEY,
    model: configValues.claude.model || process.env.OPENAI_MODEL || 'claude-3-5-sonnet-20240620',
    summaryModel:
      configValues.claude.summaryModel ||
      process.env.CLAUDE_SUMMARY_MODEL ||
      'claude-3-5-sonnet-20240620'
  };

  private mistralConfig: AiClientConfigType = {
    apiKey: configValues.mistral.apiKey || process.env.OPENAI_API_KEY,
    model: configValues.mistral.model || process.env.OPENAI_MODEL || 'mistral-large-latest',
    summaryModel:
      configValues.mistral.summaryModel ||
      process.env.MISTRAL_SUMMARY_MODEL ||
      'mistral-small-latest'
  };

  private discordConfig: DiscordConfigType = {
    token: configValues.discord.token || process.env.DISCORD_TOKEN || '',
    maxHistory:
      configValues.discord.maxHistory ||
      Number(process.env.DISCORD_MAX_HISTORY) ||
      10,
    lang: configValues.discord.lang || process.env.DISCORD_LANG || 'en'
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

  private tmpFolderConfig: TmpFolderConfigType = {
    active: true,
    path: configValues.tmpFolder.path || process.env.TMP_FOLDER_PATH || 'tmp'
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
    aiClient: configValues.aiClient || process.env.AI_CLIENT || 'openAI',
    discord: this.discordConfig,
    openAI: this.openAIConfig,
    claude: this.claudeConfig,
    mistral: this.mistralConfig,
    AIPrompt: this.AIPrompt,
    dune: this.duneConfig,
    serp: this.serpConfig,
    braveSearch: this.braveSearchConfig,
    coin: this.coinConfig,
    googleSearch: this.googleSearchConfig,
    googleLighthouse: this.lighthouseConfig,
    tmpFolder: this.tmpFolderConfig
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
    if (!this._config.AIPrompt) {
      throw new Error('No Ai Prompt configured');
    }
    if (!this._config.aiClient) {
      throw new Error('No Ai Client configured');
    }
    if (!this._config.discord.token) {
      throw new Error('No Discord token configured');
    }
    if (!this._config.openAI.apiKey && !this._config.claude.apiKey && !this._config.mistral.apiKey) {
      throw new Error('No ai client key configured');
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
  }
}
