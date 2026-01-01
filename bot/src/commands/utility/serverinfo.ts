import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('serverinfo')
  .setDescription('Display information about this server');

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const guild = interaction.guild!;
    
    const owner = await guild.fetchOwner();
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    
    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ size: 256 }) || '')
      .addFields(
        { name: '👑 Owner', value: owner.user.tag, inline: true },
        { name: '🆔 Server ID', value: guild.id, inline: true },
        { name: '📅 Created', value: `<t:${createdTimestamp}:R>`, inline: true },
        { name: '👥 Members', value: guild.memberCount.toString(), inline: true },
        { name: '💬 Channels', value: guild.channels.cache.size.toString(), inline: true },
        { name: '😀 Emojis', value: guild.emojis.cache.size.toString(), inline: true },
        { name: '🔰 Roles', value: guild.roles.cache.size.toString(), inline: true },
        { name: '🚀 Boost Tier', value: `Level ${guild.premiumTier}`, inline: true },
        { name: '💎 Boosts', value: guild.premiumSubscriptionCount?.toString() || '0', inline: true }
      )
      .setTimestamp();

    if (guild.description) {
      embed.setDescription(guild.description);
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error executing serverinfo command:', error);
    await interaction.reply({ 
      content: 'An error occurred while fetching server information.', 
      ephemeral: true 
    });
  }
}
