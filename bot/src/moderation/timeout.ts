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
  .setName('timeout')
  .setDescription('Timeout (mute) a member')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to timeout')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('duration')
      .setDescription('Duration (e.g., 10m, 1h, 1d)')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the timeout')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const target = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const duration = BotUtils.parseDuration(durationStr);
    
    if (!duration || duration < 1000 || duration > 28 * 24 * 60 * 60 * 1000) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('Invalid duration. Must be between 1 second and 28 days. Examples: 10m, 1h, 2d')] 
      });
      return;
    }

    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to timeout members.')] });
      return;
    }

    const targetMember = await interaction.guild?.members.fetch(target.id).catch(() => null);
    
    if (!targetMember) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('User is not in this server.')] });
      return;
    }

    if (!BotUtils.canModerate(executorMember as any, targetMember)) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('You cannot timeout this member. They may have higher roles or be the server owner.')] 
      });
      return;
    }

    if (!targetMember.moderatable) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('I cannot timeout this member. They may have higher roles than me.')] 
      });
      return;
    }

    try {
      const dmEmbed = BotUtils.warningEmbed(
        `You have been timed out in **${interaction.guild?.name}**\n\n` +
        `**Duration:** ${BotUtils.formatDuration(duration)}\n` +
        `**Reason:** ${reason}`,
        '🔇 Timed Out'
      );
      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }

    await targetMember.timeout(duration, `${reason} | Moderator: ${interaction.user.tag}`);

    const caseId = await BotUtils.getNextCaseId(interaction.guildId!);
    const expiresAt = new Date(Date.now() + duration);
    
    await ModCase.create({
      guildId: interaction.guildId,
      caseId,
      type: 'timeout',
      userId: target.id,
      userTag: target.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
      duration,
      active: true,
      expiresAt
    });

    await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guildId },
      { $inc: { mutes: 1 } },
      { upsert: true }
    );

    const successEmbed = BotUtils.successEmbed(
      `**${target.tag}** has been timed out for **${BotUtils.formatDuration(duration)}**.\n\n` +
      `**Case ID:** ${caseId}\n` +
      `**Reason:** ${reason}\n` +
      `**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
      '🔇 Member Timed Out'
    );
    await interaction.editReply({ embeds: [successEmbed] });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (config?.modLogChannel) {
      const logChannel = await interaction.guild?.channels.fetch(config.modLogChannel).catch(() => null);
      
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = BotUtils.infoEmbed(
          `**Member:** ${target.tag} (${target.id})\n` +
          `**Action:** Timeout\n` +
          `**Duration:** ${BotUtils.formatDuration(duration)}\n` +
          `**Moderator:** ${interaction.user.tag}\n` +
          `**Reason:** ${reason}\n` +
          `**Case ID:** ${caseId}\n` +
          `**Expires:** <t:${Math.floor(expiresAt.getTime() / 1000)}:R>`,
          '🔇 Member Timed Out'
        );
        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    }
  } catch (error) {
    console.error('Error executing timeout command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while executing the timeout command.')] 
    }).catch(() => {});
  }
}
