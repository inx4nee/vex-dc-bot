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
  .setName('ban')
  .setDescription('Ban a member from the server')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to ban')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the ban')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('delete_messages')
      .setDescription('Delete messages from the last X days (0-7)')
      .setMinValue(0)
      .setMaxValue(7)
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;

    // Check if executor is a moderator
    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to ban members.')] });
      return;
    }

    // Check if target exists in guild
    const targetMember = await interaction.guild?.members.fetch(target.id).catch(() => null);
    
    // Check if target can be moderated
    if (targetMember) {
      if (!BotUtils.canModerate(executorMember as any, targetMember)) {
        await interaction.editReply({ 
          embeds: [BotUtils.errorEmbed('You cannot ban this member. They may have higher roles or be the server owner.')] 
        });
        return;
      }

      // Check bot permissions
      if (!targetMember.bannable) {
        await interaction.editReply({ 
          embeds: [BotUtils.errorEmbed('I cannot ban this member. They may have higher roles than me.')] 
        });
        return;
      }
    }

    // Try to DM the user before banning
    try {
      const dmEmbed = BotUtils.warningEmbed(
        `You have been banned from **${interaction.guild?.name}**\n\n**Reason:** ${reason}`,
        '🔨 Banned'
      );
      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled or bot is blocked
    }

    // Execute the ban
    await interaction.guild?.members.ban(target.id, { 
      reason: `${reason} | Moderator: ${interaction.user.tag}`,
      deleteMessageSeconds: deleteMessageDays * 86400
    });

    // Create mod case
    const caseId = await BotUtils.getNextCaseId(interaction.guildId!);
    await ModCase.create({
      guildId: interaction.guildId,
      caseId,
      type: 'ban',
      userId: target.id,
      userTag: target.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
      active: true
    });

    // Update user stats
    await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guildId },
      { $inc: { bans: 1 } },
      { upsert: true }
    );

    // Send success message
    const successEmbed = BotUtils.successEmbed(
      `**${target.tag}** has been banned.\n\n**Case ID:** ${caseId}\n**Reason:** ${reason}`,
      '🔨 Member Banned'
    );
    await interaction.editReply({ embeds: [successEmbed] });

    // Log to mod log channel
    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (config?.modLogChannel) {
      const logChannel = await interaction.guild?.channels.fetch(config.modLogChannel).catch(() => null);
      
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = BotUtils.infoEmbed(
          `**Member:** ${target.tag} (${target.id})\n` +
          `**Action:** Ban\n` +
          `**Moderator:** ${interaction.user.tag}\n` +
          `**Reason:** ${reason}\n` +
          `**Case ID:** ${caseId}`,
          '🔨 Member Banned'
        );
        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    }
  } catch (error) {
    console.error('Error executing ban command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while executing the ban command.')] 
    }).catch(() => {});
  }
}
