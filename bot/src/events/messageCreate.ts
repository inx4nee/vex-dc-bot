import { Events, Message } from 'discord.js';
import GuildConfig from '../models/GuildConfig';
import User from '../models/User';

const userMessageCache = new Map<string, number[]>();
const SPAM_THRESHOLD = 5; // messages
const SPAM_TIMEFRAME = 5000; // 5 seconds

export const name = Events.MessageCreate;

export async function execute(message: Message) {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;

  const config = await GuildConfig.findOne({ guildId: message.guild.id });
  if (!config) return;

  // Check if channel is ignored
  if (config.ignoredChannels.includes(message.channel.id)) return;

  // Auto-moderation checks
  if (config.autoModEnabled) {
    let shouldDelete = false;
    let reason = '';

    // Anti-spam
    if (config.autoModSettings.antiSpam) {
      const userId = message.author.id;
      const now = Date.now();
      const userKey = `${message.guild.id}-${userId}`;
      
      if (!userMessageCache.has(userKey)) {
        userMessageCache.set(userKey, []);
      }
      
      const timestamps = userMessageCache.get(userKey)!;
      timestamps.push(now);
      
      // Clean old timestamps
      const recentTimestamps = timestamps.filter(t => now - t < SPAM_TIMEFRAME);
      userMessageCache.set(userKey, recentTimestamps);
      
      if (recentTimestamps.length > SPAM_THRESHOLD) {
        shouldDelete = true;
        reason = 'Spam detected';
        
        // Timeout user for 5 minutes
        const member = message.member;
        if (member && member.moderatable) {
          await member.timeout(5 * 60 * 1000, 'Auto-mod: Spam').catch(() => {});
        }
      }
    }

    // Anti-invite
    if (config.autoModSettings.antiInvite) {
      const inviteRegex = /(discord\.gg|discord\.com\/invite|discordapp\.com\/invite)\/[\w-]+/gi;
      if (inviteRegex.test(message.content)) {
        shouldDelete = true;
        reason = 'Discord invite link detected';
      }
    }

    // Anti-link
    if (config.autoModSettings.antiLink) {
      const linkRegex = /(https?:\/\/[^\s]+)/gi;
      if (linkRegex.test(message.content)) {
        shouldDelete = true;
        reason = 'External link detected';
      }
    }

    // Anti-caps
    if (config.autoModSettings.antiCaps && message.content.length > 10) {
      const capsPercentage = (message.content.match(/[A-Z]/g) || []).length / message.content.length;
      if (capsPercentage > 0.7) {
        shouldDelete = true;
        reason = 'Excessive caps';
      }
    }

    // Max mentions
    if (message.mentions.users.size > config.autoModSettings.maxMentions) {
      shouldDelete = true;
      reason = `Exceeded max mentions (${config.autoModSettings.maxMentions})`;
    }

    // Max emojis
    const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;
    if (emojiCount > config.autoModSettings.maxEmojis) {
      shouldDelete = true;
      reason = `Exceeded max emojis (${config.autoModSettings.maxEmojis})`;
    }

    // Delete message if it violates rules
    if (shouldDelete) {
      await message.delete().catch(() => {});
      
      // Send warning message
      const warning = await message.channel.send(
        `⚠️ ${message.author}, your message was deleted: **${reason}**`
      );
      
      // Delete warning after 5 seconds
      setTimeout(() => warning.delete().catch(() => {}), 5000);
      return;
    }
  }

  // Leveling system
  if (config.levelingEnabled) {
    const userDoc = await User.findOne({ 
      userId: message.author.id, 
      guildId: message.guild.id 
    });

    const now = Date.now();
    const cooldown = 60000; // 1 minute cooldown for XP gain

    if (!userDoc || !userDoc.lastMessageAt || now - userDoc.lastMessageAt.getTime() > cooldown) {
      const xpGain = Math.floor(Math.random() * 15) + 10; // 10-25 XP
      
      const updated = await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { 
          $inc: { messages: 1, experience: xpGain },
          lastMessageAt: new Date()
        },
        { upsert: true, new: true }
      );

      // Check for level up
      const requiredXP = updated.level * 100 + 100;
      if (updated.experience >= requiredXP) {
        updated.level += 1;
        updated.experience = 0;
        await updated.save();

        // Send level up message
        const levelUpMsg = await message.channel.send(
          `🎉 ${message.author}, you've leveled up to **Level ${updated.level}**!`
        );
        setTimeout(() => levelUpMsg.delete().catch(() => {}), 10000);
      }
    }
  }
}
