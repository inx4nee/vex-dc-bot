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
  .setName('kick')
  .setDescription('Kick a member from the server')
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('The user to kick')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('reason')
      .setDescription('Reason for the kick')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply();

    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to kick members.')] });
      return;
    }

    const targetMember = await interaction.guild?.members.fetch(target.id).catch(() => null);
    
    if (!targetMember) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('User is not in this server.')] });
      return;
    }

    if (!BotUtils.canModerate(executorMember as any, targetMember)) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('You cannot kick this member. They may have higher roles or be the server owner.')] 
      });
      return;
    }

    if (!targetMember.kickable) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('I cannot kick this member. They may have higher roles than me.')] 
      });
      return;
    }

    try {
      const dmEmbed = BotUtils.warningEmbed(
        `You have been kicked from **${interaction.guild?.name}**\n\n**Reason:** ${reason}`,
        '👢 Kicked'
      );
      await target.send({ embeds: [dmEmbed] });
    } catch {
      // User has DMs disabled
    }

    await targetMember.kick(`${reason} | Moderator: ${interaction.user.tag}`);

    const caseId = await BotUtils.getNextCaseId(interaction.guildId!);
    await ModCase.create({
      guildId: interaction.guildId,
      caseId,
      type: 'kick',
      userId: target.id,
      userTag: target.tag,
      moderatorId: interaction.user.id,
      moderatorTag: interaction.user.tag,
      reason,
      active: true
    });

    await User.findOneAndUpdate(
      { userId: target.id, guildId: interaction.guildId },
      { $inc: { kicks: 1 } },
      { upsert: true }
    );

    const successEmbed = BotUtils.successEmbed(
      `**${target.tag}** has been kicked.\n\n**Case ID:** ${caseId}\n**Reason:** ${reason}`,
      '👢 Member Kicked'
    );
    await interaction.editReply({ embeds: [successEmbed] });

    const config = await GuildConfig.findOne({ guildId: interaction.guildId });
    if (config?.modLogChannel) {
      const logChannel = await interaction.guild?.channels.fetch(config.modLogChannel).catch(() => null);
      
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = BotUtils.infoEmbed(
          `**Member:** ${target.tag} (${target.id})\n` +
          `**Action:** Kick\n` +
          `**Moderator:** ${interaction.user.tag}\n` +
          `**Reason:** ${reason}\n` +
          `**Case ID:** ${caseId}`,
          '👢 Member Kicked'
        );
        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    }
  } catch (error) {
    console.error('Error executing kick command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while executing the kick command.')] 
    }).catch(() => {});
  }
}
