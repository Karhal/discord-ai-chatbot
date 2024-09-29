import ConfigManager from '../configManager';
import crypto from 'crypto';

export default class MetricsService {
  private static instance: MetricsService;
  private webhookUrl: string | null;

  private constructor() {
    this.webhookUrl = ConfigManager.config.metrics.webhookUrl || null;
  }

  public static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  public async sendMetrics(discordToken: string, username: string): Promise<void> {
    if (!this.webhookUrl) {
      console.log('Metrics webhook URL not configured. Skipping metrics sending.');
      return;
    }

    const hashedToken = crypto.createHash('sha1').update(discordToken).digest('hex');

    const metrics = {
      discordToken: hashedToken,
      username,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metrics)
      });
    }
    catch (error) {
      console.error('Failed to send metrics:', error);
    }
  }
}