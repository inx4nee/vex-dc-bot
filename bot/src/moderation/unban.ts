import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';
import { BotUtils } from '../../utils/BotUtils';
import ModCase from '../../models/ModCase';
import GuildConfig from '../../models/GuildConfig';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Unban a user from the server')
  .addStringOption(option =>
    option
      .setName('user_id')
      .setDescription('The ID of the user to unban')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the unban')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to unban members.')] });
      return;
    }

    // Check if user is actually banned
    try {
      await interaction.guild?.bans.fetch(userId);
    } catch {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('This user is not banned from this server.')] });
      return;
    }

    // Unban the user
    await interaction.guild?.bans.remove(userId, `${reason} | Moderator: ${interaction.user.tag}`);

    // Update mod cases to mark ban as inactive
    await ModCase.updateMany(
      { guildId: interaction.guildId, userId, type: 'ban', active: true },
      { active: false }
    );

    // Create unban case
    const caseId = await BotUtils.getNextCaseId(interaction.guildId!);
    await ModCase.create({
      guildId: interaction.guildId,
      caseId,
      type: 'unban',
      userId: userId,
      userTag: 'Unknown#0000',
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
      active: true
    });

    const successEmbed = BotUtils.successEmbed(
      `User with ID **${userId}** has been unbanned.\n\n**Case ID:** ${caseId}\n**Reason:** ${reason}`,
      '✅ User Unbanned'
    );
    await interaction.editReply({ embeds: [successEmbed] });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (config?.modLogChannel) {
      const logChannel = await interaction.guild?.channels.fetch(config.modLogChannel).catch(() => null);
      
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = BotUtils.infoEmbed(
          `**User ID:** ${userId}\n` +
          `**Action:** Unban\n` +
          `**Moderator:** ${interaction.user.tag}\n` +
          `**Reason:** ${reason}\n` +
          `**Case ID:** ${caseId}`,
          '✅ User Unbanned'
        );
        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    }
  } catch (error) {
    console.error('Error executing unban command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while executing the unban command.')] 
    }).catch(() => {});
  }
}
