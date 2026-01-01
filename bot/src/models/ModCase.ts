import mongoose, { Schema, Document } from 'mongoose';

export interface IModCase extends Document {
  guildId: string;
  caseId: number;
  type: 'warn' | 'kick' | 'ban' | 'mute' | 'unmute' | 'unban' | 'timeout';
  userId: string;
  userTag: string;
  moderatorId: string;
  moderatorTag: string;
  reason: string;
  duration?: number; // in milliseconds
  active: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

const ModCaseSchema = new Schema<IModCase>({
  guildId: { type: String, required: true, index: true },
  caseId: { type: Number, required: true },
  type: { 
    type: String, 
    required: true,
    enum: ['warn', 'kick', 'ban', 'mute', 'unmute', 'unban', 'timeout']
  },
  userId: { type: String, required: true, index: true },
  userTag: { type: String, required: true },
  moderatorId: { type: String, required: true },
  moderatorTag: { type: String, required: true },
  reason: { type: String, required: true },
  duration: { type: Number },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date }
}, {
  timestamps: true
});

// Compound index for efficient queries
ModCaseSchema.index({ guildId: 1, caseId: 1 }, { unique: true });
ModCaseSchema.index({ guildId: 1, userId: 1 });

export default mongoose.model<IModCase>('ModCase', ModCaseSchema);
