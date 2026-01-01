import { Client, GatewayIntentBits, Partials } from 'discord.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readdirSync } from 'fs';
import { join } from 'path';
import express from 'express';
import cors from 'cors';

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

// Connect to MongoDB
async function connectDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/discord-mod-bot';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Load event handlers
async function loadEvents() {
  const eventFiles = readdirSync(join(__dirname, 'events')).filter(
    file => file.endsWith('.ts') || file.endsWith('.js')
  );

  for (const file of eventFiles) {
    const event = await import(`./events/${file}`);
    
    // Handle standard events
    if (event.name && event.execute) {
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      console.log(`📥 Loaded event: ${event.name}`);
    }
    
    // Handle guild events (special case)
    if (event.guildCreateName && event.guildCreateExecute) {
      client.on(event.guildCreateName, (...args) => event.guildCreateExecute(...args));
      console.log(`📥 Loaded event: ${event.guildCreateName}`);
    }
    
    if (event.guildDeleteName && event.guildDeleteExecute) {
      client.on(event.guildDeleteName, (...args) => event.guildDeleteExecute(...args));
      console.log(`📥 Loaded event: ${event.guildDeleteName}`);
    }
  }
}

// Create API server for web dashboard
function createAPIServer() {
  const app = express();
  const PORT = process.env.BOT_API_PORT || 3001;

  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      guilds: client.guilds.cache.size,
      uptime: process.uptime() 
    });
  });

  // Get bot guilds
  app.get('/api/guilds', (req, res) => {
    const guilds = client.guilds.cache.map(guild => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount
    }));
    res.json(guilds);
  });

  // Import API routes
  import('./api/routes').then(routes => {
    app.use('/api', routes.default(client));
  }).catch(err => {
    console.error('Error loading API routes:', err);
  });

  app.listen(PORT, () => {
    console.log(`🌐 API server running on port ${PORT}`);
  });
}

// Start the bot
async function start() {
  try {
    await connectDatabase();
    await loadEvents();
    
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      console.error('❌ DISCORD_TOKEN is not set in environment variables');
      process.exit(1);
    }

    await client.login(token);
    
    // Start API server after bot is ready
    client.once('ready', () => {
      createAPIServer();
    });

  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⚠️ Shutting down...');
  await mongoose.connection.close();
  client.destroy();
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

// Start the application
start();
