import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  TextChannel
} from 'discord.js';
import { BotUtils } from '../../utils/BotUtils';
import ModCase from '../../models/ModCase';
import User from '../../models/User';
import GuildConfig from '../../models/GuildConfig';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Warn a member')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to warn')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the warning')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to warn members.')] });
      return;
    }

    const targetMember = await interaction.guild?.members.fetch(target.id).catch(() => null);
    
    if (!targetMember) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('User is not in this server.')] });
      return;
    }

    if (!BotUtils.canModerate(executorMember as any, targetMember)) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('You cannot warn this member. They may have higher roles or be the server owner.')] 
      });
      return;
    }

    const caseId = await BotUtils.getNextCaseId(interaction.guildId!);
    await ModCase.create({
      guildId: interaction.guildId,
      caseId,
      type: 'warn',
      userId: target.id,
      userTag: target.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
      active: true
    });

    const userDoc = await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guildId },
      { $inc: { warnings: 1 } },
      { upsert: true, new: true }
    );

    try {
      const dmEmbed = BotUtils.warningEmbed(
        `You have been warned in **${interaction.guild?.name}**\n\n` +
        `**Reason:** ${reason}\n` +
        `**Total Warnings:** ${userDoc?.warnings || 1}\n` +
        `**Case ID:** ${caseId}`,
        '⚠️ Warning Received'
      );
      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }

    const successEmbed = BotUtils.successEmbed(
      `**${target.tag}** has been warned.\n\n` +
      `**Case ID:** ${caseId}\n` +
      `**Reason:** ${reason}\n` +
      `**Total Warnings:** ${userDoc?.warnings || 1}`,
      '⚠️ Member Warned'
    );
    await interaction.editReply({ embeds: [successEmbed] });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (config?.modLogChannel) {
      const logChannel = await interaction.guild?.channels.fetch(config.modLogChannel).catch(() => null);
      
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = BotUtils.infoEmbed(
          `**Member:** ${target.tag} (${target.id})\n` +
          `**Action:** Warning\n` +
          `**Moderator:** ${interaction.user.tag}\n` +
          `**Reason:** ${reason}\n` +
          `**Case ID:** ${caseId}\n` +
          `**Total Warnings:** ${userDoc?.warnings || 1}`,
          '⚠️ Member Warned'
        );
        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    }
  } catch (error) {
    console.error('Error executing warn command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while executing the warn command.')] 
    }).catch(() => {});
  }
}
