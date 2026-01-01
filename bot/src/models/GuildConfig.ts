import mongoose, { Schema, Document } from 'mongoose';

export interface IGuildConfig extends Document {
  guildId: string;
  guildName: string;
  prefix: string;
  modLogChannel?: string;
  muteRole?: string;
  autoModEnabled: boolean;
  autoModSettings: {
    antiSpam: boolean;
    antiInvite: boolean;
    antiLink: boolean;
    antiCaps: boolean;
    profanityFilter: boolean;
    maxMentions: number;
    maxEmojis: number;
  };
  welcomeSettings: {
    enabled: boolean;
    channel?: string;
    message: string;
  };
  farewellSettings: {
    enabled: boolean;
    channel?: string;
    message: string;
  };
  levelingEnabled: boolean;
  moderatorRoles: string[];
  adminRoles: string[];
  ignoredChannels: string[];
  customCommands: Array<{
    name: string;
    response: string;
    enabled: boolean;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const GuildConfigSchema = new Schema<IGuildConfig>({
  guildId: { type: String, required: true, unique: true },
  guildName: { type: String, required: true },
  prefix: { type: String, default: '!' },
  modLogChannel: { type: String },
  muteRole: { type: String },
  autoModEnabled: { type: Boolean, default: false },
  autoModSettings: {
    antiSpam: { type: Boolean, default: true },
    antiInvite: { type: Boolean, default: true },
    antiLink: { type: Boolean, default: false },
    antiCaps: { type: Boolean, default: false },
    profanityFilter: { type: Boolean, default: false },
    maxMentions: { type: Number, default: 5 },
    maxEmojis: { type: Number, default: 10 }
  },
  welcomeSettings: {
    enabled: { type: Boolean, default: false },
    channel: { type: String },
    message: { type: String, default: 'Welcome {user} to {server}!' }
  },
  farewellSettings: {
    enabled: { type: Boolean, default: false },
    channel: { type: String },
    message: { type: String, default: 'Goodbye {user}, we\'ll miss you!' }
  },
  levelingEnabled: { type: Boolean, default: false },
  moderatorRoles: [{ type: String }],
  adminRoles: [{ type: String }],
  ignoredChannels: [{ type: String }],
  customCommands: [{
    name: { type: String, required: true },
    response: { type: String, required: true },
    enabled: { type: Boolean, default: true }
  }]
}, {
  timestamps: true
});

export default mongoose.model<IGuildConfig>('GuildConfig', GuildConfigSchema);
