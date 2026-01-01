import { Events, Guild } from 'discord.js';
import { BotUtils } from '../utils/BotUtils';

// Guild Join Event
export const guildCreateName = Events.GuildCreate;

export async function guildCreateExecute(guild: Guild) {
  console.log(`✅ Joined new guild: ${guild.name} (${guild.id})`);
  
  // Create default configuration for new guild
  await BotUtils.getGuildConfig(guild);
  
  // Try to send welcome message to system channel
  if (guild.systemChannel) {
    const embed = BotUtils.successEmbed(
      `Thank you for adding me to **${guild.name}**!\n\n` +
      `🎯 Get started with \`/help\` to see all available commands.\n` +
      `⚙️ Configure the bot via the web dashboard for advanced features!\n\n` +
      `**Quick Setup:**\n` +
      `• Set mod log channel: Use the dashboard\n` +
      `• Configure auto-mod: Use the dashboard\n` +
      `• Set moderator roles: Use the dashboard`,
      '👋 Welcome!'
    );
    
    await guild.systemChannel.send({ embeds: [embed] }).catch(() => {});
  }
}

// Guild Leave Event
export const guildDeleteName = Events.GuildDelete;

export async function guildDeleteExecute(guild: Guild) {
  console.log(`❌ Left guild: ${guild.name} (${guild.id})`);
  
  // Optionally: Keep data for X days before deletion
  // For now, we'll keep the data in case they re-add the bot
}
