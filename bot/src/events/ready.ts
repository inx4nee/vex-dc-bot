import { Client, Events } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client) {
  console.log(`✅ Bot is ready! Logged in as ${client.user?.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  
  // Set bot status
  client.user?.setPresence({
    activities: [{ name: '/help | Vex Moderation', type: 3 }], // 3 = Watching
    status: 'online'
  });

  // Register slash commands
  if (!client.application) return;

  const commands: any[] = [];
  const commandFolders = readdirSync(join(__dirname, '../commands'));

  for (const folder of commandFolders) {
    const commandFiles = readdirSync(join(__dirname, '../commands', folder)).filter(
      file => file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of commandFiles) {
      const command = await import(`../commands/${folder}/${file}`);
      if (command.data) {
        commands.push(command.data.toJSON());
      }
    }
  }

  try {
    console.log(`🔄 Started refreshing ${commands.length} application (/) commands.`);
    
    // Register commands globally
    await client.application.commands.set(commands);
    
    console.log(`✅ Successfully reloaded ${commands.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}
