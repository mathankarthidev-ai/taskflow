import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole, TeamName } from '@/types';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  avatar: string;
  birthday?: string;
  dob?: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['Team Member', 'Team Lead', 'Super Admin'],
      default: 'Team Member',
    },
    team: {
      type: String,
      enum: ['Creative', 'Marketing', 'Development'],
      required: true,
    },
    avatar: { type: String, default: '' },
    birthday: { type: String },
    dob: { type: String },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  (mongoose?.models?.User as Model<IUserDocument>) ||
  (mongoose?.model ? mongoose.model<IUserDocument>('User', UserSchema) : ({} as Model<IUserDocument>));
