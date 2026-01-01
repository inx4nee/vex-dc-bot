import { 
  ChatInputCommandInteraction, 
  SlashCommandBuilder, 
  PermissionFlagsBits,
  TextChannel,
  Collection,
  Message
} from 'discord.js';
import { BotUtils } from '../../utils/BotUtils';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Delete multiple messages at once')
  .addIntegerOption(option =>
    option
      .setName('amount')
      .setDescription('Number of messages to delete (1-100)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(100)
  )
  .addUserOption(option =>
    option
      .setName('user')
      .setDescription('Only delete messages from this user')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction: ChatInputCommandInteraction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user');

    const executorMember = interaction.member;
    if (!executorMember || typeof executorMember === 'string') {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('Could not verify your permissions.')] });
      return;
    }

    const isMod = await BotUtils.isModerator(executorMember as any);
    if (!isMod) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('You do not have permission to purge messages.')] });
      return;
    }

    if (!interaction.channel || !interaction.channel.isTextBased()) {
      await interaction.editReply({ embeds: [BotUtils.errorEmbed('This command can only be used in text channels.')] });
      return;
    }

    const channel = interaction.channel as TextChannel;

    // Fetch messages
    let messages = await channel.messages.fetch({ limit: amount + 1 }); // +1 to account for command message
    
    // Filter by user if specified
    if (targetUser) {
      messages = messages.filter(msg => msg.author.id === targetUser.id);
    }

    // Remove interaction message from collection
    messages = messages.filter(msg => msg.id !== interaction.id);

    // Filter messages older than 14 days (Discord API limitation)
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const deletableMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

    if (deletableMessages.size === 0) {
      await interaction.editReply({ 
        embeds: [BotUtils.errorEmbed('No messages found to delete. Messages older than 14 days cannot be bulk deleted.')] 
      });
      return;
    }

    // Delete messages
    const deleted = await channel.bulkDelete(deletableMessages, true);

    const successEmbed = BotUtils.successEmbed(
      `Successfully deleted **${deleted.size}** message${deleted.size !== 1 ? 's' : ''}` +
      (targetUser ? ` from **${targetUser.tag}**` : '') + '.',
      '🗑️ Messages Purged'
    );

    await interaction.editReply({ embeds: [successEmbed] });

    // Send temporary confirmation message
    const confirmMsg = await channel.send({ embeds: [successEmbed] });
    setTimeout(() => confirmMsg.delete().catch(() => {}), 5000);

  } catch (error) {
    console.error('Error executing purge command:', error);
    await interaction.editReply({ 
      embeds: [BotUtils.errorEmbed('An error occurred while purging messages.')] 
    }).catch(() => {});
  }
}
