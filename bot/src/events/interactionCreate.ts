import { Events, Interaction, Collection } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

export const name = Events.InteractionCreate;

const commandCache = new Collection<string, any>();

async function loadCommands() {
  if (commandCache.size > 0) return;

  const commandFolders = readdirSync(join(__dirname, '../commands'));

  for (const folder of commandFolders) {
    const commandFiles = readdirSync(join(__dirname, '../commands', folder)).filter(
      file => file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const command = await import(`../commands/${folder}/${file}`);
      if (command.data && command.execute) {
        commandCache.set(command.data.name, command);
      }
    }
  }
}

export async function execute(interaction: Interaction) {
  if (!interaction.isChatInputCommand()) return;

  await loadCommands();

  const command = commandCache.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorMessage = 'There was an error while executing this command!';
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
    }
  }
}
