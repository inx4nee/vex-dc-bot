import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Display bot commands and information');

export async function execute(interaction: ChatInputCommandInteraction) {
  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('🤖 Vex - Moderation Bot')
    .setDescription('A comprehensive moderation bot with web dashboard support.')
    .addFields(
      { 
        name: '🛡️ Moderation Commands', 
        value: '`/ban` `/kick` `/warn` `/timeout` `/unban` `/purge` `/modlogs`' 
      },
      { 
        name: '⚙️ Configuration Commands', 
        value: '`/config` - Configure bot settings via web dashboard' 
      },
      { 
        name: '📊 Utility Commands', 
        value: '`/serverinfo` `/userinfo` `/ping` `/help`' 
      },
      { 
        name: '🌐 Web Dashboard', 
        value: 'Configure your server settings at: **http://your-domain.com**\n' +
               'Set up auto-moderation, welcome messages, mod roles, and more!' 
      },
      { 
        name: '✨ Features', 
        value: '• Advanced moderation tools\n' +
               '• Auto-moderation (spam, invites, links)\n' +
               '• Detailed logging\n' +
               '• Warning system\n' +
               '• Timed punishments\n' +
               '• Web-based configuration' 
      }
    )
    .setFooter({ text: 'For detailed command info, use: /commandname' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
