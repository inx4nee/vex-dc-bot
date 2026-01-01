import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder,
  EmbedBuilder
} from 'discord.js';
import User from '../../models/User';

export const data = new SlashCommandBuilder()
  .setName('userinfo')
  .setDescription('Display information about a user')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to get information about')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = await interaction.guild?.members.fetch(targetUser.id);

    if (!member) {
      await interaction.reply({ content: 'User not found in this server.', ephemeral: true });
      return;
    }

    const userDoc = await User.findOne({ userId: targetUser.id, guildId: interaction.guildId });
    
    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guildId)
      .sort((a, b) => b.position - a.position)
      .map(role => role.toString())
      .slice(0, 10);

    const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
    const joinedTimestamp = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

    const embed = new EmbedBuilder()
      .setColor(member.displayHexColor || 0x3498DB)
      .setTitle(`👤 ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 User ID', value: targetUser.id, inline: true },
        { name: '📅 Account Created', value: `<t:${createdTimestamp}:R>`, inline: true },
        { name: '📥 Joined Server', value: joinedTimestamp ? `<t:${joinedTimestamp}:R>` : 'Unknown', inline: true }
      );

    if (userDoc) {
      embed.addFields(
        { name: '⚠️ Warnings', value: userDoc.warnings.toString(), inline: true },
        { name: '👢 Kicks', value: userDoc.kicks.toString(), inline: true },
        { name: '🔨 Bans', value: userDoc.bans.toString(), inline: true }
      );

      if (userDoc.level > 0) {
        embed.addFields(
          { name: '📊 Level', value: userDoc.level.toString(), inline: true },
          { name: '⭐ XP', value: userDoc.experience.toString(), inline: true }
        );
      }
    }

    if (roles.length > 0) {
      embed.addFields({ 
        name: `🎭 Roles [${member.roles.cache.size - 1}]`, 
        value: roles.join(', ') + (member.roles.cache.size > 11 ? '...' : '') 
      });
    }

    if (member.premiumSince) {
      const boostTimestamp = Math.floor(member.premiumSinceTimestamp! / 1000);
      embed.addFields({ 
        name: '💎 Server Booster', 
        value: `Since <t:${boostTimestamp}:R>` 
      });
    }

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error('Error executing userinfo command:', error);
    await interaction.reply({ 
      content: 'An error occurred while fetching user information.', 
      ephemeral: true 
    });
  }
}
