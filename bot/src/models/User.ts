import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  guildId: string;
  warnings: number;
  kicks: number;
  bans: number;
  mutes: number;
  messages: number;
  experience: number;
  level: number;
  lastMessageAt?: Date;
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  warnings: { type: Number, default: 0 },
  kicks: { type: Number, default: 0 },
  bans: { type: Number, default: 0 },
  mutes: { type: Number, default: 0 },
  messages: { type: Number, default: 0 },
  experience: { type: Number, default: 0 },
  level: { type: Number, default: 0 },
  lastMessageAt: { type: Date }
}, {
  timestamps: true
});

// Compound index for efficient user lookups per guild
UserSchema.index({ userId: 1, guildId: 1 }, { unique: true });

export default mongoose.model<IUser>('User', UserSchema);
