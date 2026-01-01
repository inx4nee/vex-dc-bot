import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  EmbedBuilder
} from 'discord.js';
import { BotUtils } from '../../utils/BotUtils';
import ModCase from '../../models/ModCase';

export const data = new SlashCommandBuilder()
  .setName('modlogs')
  .setDescription('View moderation logs')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('View logs for a specific user')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('case')
      .setDescription('View a specific case')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const targetUser = interaction.options.getUser('user');
    const caseId = interaction.options.getInteger('case');

    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to view mod logs.')] });
      return;
    }

    // Fetch specific case
    if (caseId) {
      const modCase = await ModCase.findOne({ guildId: interaction.guildId, caseId });
      
      if (!modCase) {
        await interaction.editReply({ embeds: [BotUtils.errorEmbed(`Case #${caseId} not found.`)] });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`📋 Case #${modCase.caseId}`)
        .addFields(
          { name: 'Type', value: modCase.type.toUpperCase(), inline: true },
          { name: 'User', value: `${modCase.userTag} (${modCase.userId})`, inline: true },
          { name: 'Moderator', value: `${modCase.moderatorTag}`, inline: true },
          { name: 'Reason', value: modCase.reason },
          { name: 'Date', value: `<t:${Math.floor(modCase.createdAt.getTime() / 1000)}:F>`, inline: true },
          { name: 'Status', value: modCase.active ? '🟢 Active' : '🔴 Inactive', inline: true }
        )
        .setTimestamp();

      if (modCase.duration) {
        embed.addFields({ 
          name: 'Duration', 
          value: BotUtils.formatDuration(modCase.duration), 
          inline: true 
        });
      }

      if (modCase.expiresAt) {
        embed.addFields({ 
          name: 'Expires', 
          value: `<t:${Math.floor(modCase.expiresAt.getTime() / 1000)}:R>`, 
          inline: true 
        });
      }

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Fetch user cases
    if (targetUser) {
      const cases = await ModCase.find({ 
        guildId: interaction.guildId, 
        userId: targetUser.id 
      })
        .sort({ createdAt: -1 })
        .limit(10);

      if (cases.length === 0) {
        await interaction.editReply({ 
          embeds: [BotUtils.infoEmbed(`No moderation history found for **${targetUser.tag}**.`)] 
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0x3498DB)
        .setTitle(`📋 Moderation History: ${targetUser.tag}`)
        .setDescription(
          cases.map(c => 
            `**Case #${c.caseId}** - ${c.type.toUpperCase()}\n` +
            `*Moderator:* ${c.moderatorTag}\n` +
            `*Reason:* ${BotUtils.truncate(c.reason, 100)}\n` +
            `*Date:* <t:${Math.floor(c.createdAt.getTime() / 1000)}:R>\n`
          ).join('\n')
        )
        .setFooter({ text: `Showing last ${cases.length} cases` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Fetch recent cases
    const cases = await ModCase.find({ guildId: interaction.guildId })
      .sort({ createdAt: -1 })
      .limit(10);

    if (cases.length === 0) {
      await interaction.editReply({ 
        embeds: [BotUtils.infoEmbed('No moderation cases found for this server.')] 
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x3498DB)
      .setTitle('📋 Recent Moderation Cases')
      .setDescription(
        cases.map(c => 
          `**Case #${c.caseId}** - ${c.type.toUpperCase()}\n` +
          `*User:* ${c.userTag}\n` +
          `*Moderator:* ${c.moderatorTag}\n` +
          `*Reason:* ${BotUtils.truncate(c.reason, 80)}\n` +
          `*Date:* <t:${Math.floor(c.createdAt.getTime() / 1000)}:R>\n`
        ).join('\n')
      )
      .setFooter({ text: `Showing last ${cases.length} cases | Use /modlogs user:<user> for specific user` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error executing modlogs command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while fetching mod logs.')] 
    }).catch(() => {});
  }
}
