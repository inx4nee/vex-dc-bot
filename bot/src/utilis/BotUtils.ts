import { 
  PermissionFlagsBits, 
  GuildMember, 
  EmbedBuilder, 
  ColorResolvable,
  Guild
} from 'discord.js';
import GuildConfig from '../models/GuildConfig';
import ModCase from '../models/ModCase';
import ms from 'ms';

export class BotUtils {
  /**
   * Check if a member has moderator permissions
   */
  static async isModerator(member: GuildMember): Promise<boolean> {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) return true;
    
    const config = await GuildConfig.findOne({ guildId: member.guild.id });
    if (!config) return false;
    
    return member.roles.cache.some(role => 
      config.moderatorRoles.includes(role.id) || config.adminRoles.includes(role.id)
    );
  }

  /**
   * Check if a member has admin permissions
   */
  static async isAdmin(member: GuildMember): Promise<boolean> {
    if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
    
    const config = await GuildConfig.findOne({ guildId: member.guild.id });
    if (!config) return false;
    
    return member.roles.cache.some(role => config.adminRoles.includes(role.id));
  }

  /**
   * Check if action can be performed on target
   */
  static canModerate(executor: GuildMember, target: GuildMember): boolean {
    if (executor.id === target.id) return false;
    if (target.guild.ownerId === target.id) return false;
    if (executor.guild.ownerId !== executor.id && 
        executor.roles.highest.position <= target.roles.highest.position) {
      return false;
    }
    return true;
  }

  /**
   * Create success embed
   */
  static successEmbed(description: string, title?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x00FF00 as ColorResolvable)
      .setTitle(title || '✅ Success')
      .setDescription(description)
      .setTimestamp();
  }

  /**
   * Create error embed
   */
  static errorEmbed(description: string, title?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0xFF0000 as ColorResolvable)
      .setTitle(title || '❌ Error')
      .setDescription(description)
      .setTimestamp();
  }

  /**
   * Create info embed
   */
  static infoEmbed(description: string, title?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0x3498DB as ColorResolvable)
      .setTitle(title || 'ℹ️ Information')
      .setDescription(description)
      .setTimestamp();
  }

  /**
   * Create warning embed
   */
  static warningEmbed(description: string, title?: string): EmbedBuilder {
    return new EmbedBuilder()
      .setColor(0xFFAA00 as ColorResolvable)
      .setTitle(title || '⚠️ Warning')
      .setDescription(description)
      .setTimestamp();
  }

  /**
   * Get next case ID for a guild
   */
  static async getNextCaseId(guildId: string): Promise<number> {
    const lastCase = await ModCase.findOne({ guildId })
      .sort({ caseId: -1 })
      .limit(1);
    
    return lastCase ? lastCase.caseId + 1 : 1;
  }

  /**
   * Parse duration string to milliseconds
   */
  static parseDuration(duration: string): number | null {
    try {
      const parsed = ms(duration);
      return parsed || null;
    } catch {
      return null;
    }
  }

  /**
   * Format duration from milliseconds to readable string
   */
  static formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Get or create guild config
   */
  static async getGuildConfig(guild: Guild) {
    let config = await GuildConfig.findOne({ guildId: guild.id });
    
    if (!config) {
      config = await GuildConfig.create({
        guildId: guild.id,
        guildName: guild.name,
        prefix: process.env.PREFIX || '!',
        autoModEnabled: false,
        autoModSettings: {
          antiSpam: true,
          antiInvite: true,
          antiLink: false,
          antiCaps: false,
          profanityFilter: false,
          maxMentions: 5,
          maxEmojis: 10
        },
        welcomeSettings: {
          enabled: false,
          message: 'Welcome {user} to {server}!'
        },
        farewellSettings: {
          enabled: false,
          message: 'Goodbye {user}, we\'ll miss you!'
        },
        levelingEnabled: false,
        moderatorRoles: [],
        adminRoles: [],
        ignoredChannels: [],
        customCommands: []
      });
    }
    
    return config;
  }

  /**
   * Truncate text to specified length
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}
