import { GuildMember, Message, TextChannel, PermissionsBitField } from 'discord.js';
import ConfigManager from '../configManager';

export interface ModerationRule {
  type: 'ban' | 'kick' | 'timeout' | 'warn';
  condition: (content: string) => boolean | Promise<boolean>;
  action: (member: GuildMember, reason: string) => Promise<void>;
  message: string;
}

export default class ModerationService {
  private static instance: ModerationService;
  private rules: ModerationRule[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): ModerationService {
    if (!ModerationService.instance) {
      ModerationService.instance = new ModerationService();
    }
    return ModerationService.instance;
  }

  private async checkUrlWithGoogleSafeBrowsing(url: string): Promise<boolean> {
    const API_KEY = ConfigManager.config.moderation.googleSafeBrowsingKey;
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${API_KEY}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client: {
            clientId: 'Ugo-Moderator',
            clientVersion: '1.0.0'
          },
          threatInfo: {
            threatTypes: [
              'MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE', 'POTENTIALLY_HARMFUL_APPLICATION'
            ],
            platformTypes: ['ANY_PLATFORM'],
            threatEntryTypes: ['URL'],
            threatEntries: [{ url }]
          }
        })
      });

      const data = await response.json();
      console.log('Safe Browsing API response:', data);
      return Boolean(data.matches?.length);
    }
    catch (error) {
      console.error('Safe Browsing API error:', error);
      return false;
    }
  }

  private initializeDefaultRules() {
    this.addRule({
      type: 'timeout',
      condition: (content: string) => {
        const bannedWords = ConfigManager.config.moderation.bannedWords;
        return bannedWords.some(word =>
          content.toLowerCase().includes(word.toLowerCase())
        );
      },
      action: async (member: GuildMember, reason: string) => {
        await member.timeout(ConfigManager.config.moderation.actions.timeout, reason);
      },
      message: 'You have been timed out for 5 minutes.'
    });

    this.addRule({
      type: 'ban',
      condition: async (content: string) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = content.match(urlRegex);

        if (!urls) return false;
        console.log('URLs trouvées:', urls);

        for (const url of urls) {
          try {
            console.log('URL check:', url);
            const isMalicious = await this.checkUrlWithGoogleSafeBrowsing(url);
            console.log('Results:', url, ':', isMalicious);
            if (isMalicious) return true;
          }
          catch (error) {
            console.error('URL check error:', error);
          }
        }
        return false;
      },
      action: async (member: GuildMember, reason: string) => {
        if (!member.bannable) {
          console.log('Member is not bannable');
          return;
        }
        await member.ban({
          reason: reason,
          deleteMessageSeconds: 60 * 60 * 24 * 7
        });
      },
      message: 'Banned for sharing malicious links'
    });
  }

  public addRule(rule: ModerationRule) {
    this.rules.push(rule);
  }

  private async canModerate(member: GuildMember): Promise<boolean> {
    const botMember = member.guild.members.cache.get(member.client.user.id);

    if (!botMember) return false;

    return botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers);
  }

  public async moderateMessage(message: Message): Promise<void> {
    if (message.author.bot) return;

    if (!message.member || !await this.canModerate(message.member)) {
      console.warn('Bot lacks permission to moderate members');
      return;
    }

    for (const rule of this.rules) {
      try {
        const conditionResult = rule.condition(message.content);
        const isViolation = conditionResult instanceof Promise
          ? await conditionResult
          : conditionResult;

        if (isViolation) {
          const member = message.member;
          if (!member) continue;

          await rule.action(member, rule.message);
          await this.notifyModeration(message.channel as TextChannel, member, rule);
          await message.delete();
          break;
        }
      }
      catch (error) {
        console.error('Moderation action failed:', error);
      }
    }
  }

  private async notifyModeration(
    channel: TextChannel,
    member: GuildMember,
    rule: ModerationRule
  ): Promise<void> {
    await channel.send(
      `${member.user.username} has been punished (${rule.type}): ${rule.message}`
    );
  }
}