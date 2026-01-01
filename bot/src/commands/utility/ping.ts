import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { BotUtils } from '../../utils/BotUtils';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Check the bot\'s latency');

export async function execute(interaction: ChatInputCommandInteraction) {
  const sent = await interaction.reply({ 
    embeds: [BotUtils.infoEmbed('Pinging...')], 
    fetchReply: true 
  });
  
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  const apiLatency = Math.round(interaction.client.ws.ping);

  const embed = BotUtils.successEmbed(
    `🏓 **Pong!**\n\n` +
    `**Bot Latency:** ${latency}ms\n` +
    `**API Latency:** ${apiLatency}ms`,
    '📊 Latency Information'
  );

  await interaction.editReply({ embeds: [embed] });
}
