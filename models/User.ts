import mongoose, { Schema, Document, Model } from 'mongoose';
import { UserRole, TeamName, CompanyBranch, WorkMode } from '@/types';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  role: UserRole;
  team: TeamName;
  company?: CompanyBranch;
  avatar: string;
  birthday?: string;
  dob?: string;
  workMode?: WorkMode;
  permissionCount?: number;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  bankAccount?: string;
  taxId?: string;
  bloodGroup?: string;
  education?: any[];
  experience?: any[];
  skills?: string[];
  createdAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: {
      type: String,
      enum: ['Team Member', 'Team Lead', 'Super Admin', 'Admin', 'Reception Staff'],
      default: 'Team Member',
    },
    team: {
      type: String,
      enum: ['Creative', 'Marketing', 'Development'],
      required: true,
    },
    company: {
      type: String,
      enum: ['Ambizcon Health - India', 'Ambizcon', 'India & Australia'],
      default: 'Ambizcon Health - India',
    },
    avatar: { type: String, default: '' },
    birthday: { type: String },
    dob: { type: String },
    workMode: {
      type: String,
      enum: ['Work From Office', 'Work From Home'],
      default: 'Work From Office',
    },
    permissionCount: { type: Number, default: 0 },
    phone: { type: String },
    emergencyContact: { type: String },
    address: { type: String },
    bankAccount: { type: String },
    taxId: { type: String },
    bloodGroup: { type: String },
    education: { type: Schema.Types.Mixed, default: [] },
    experience: { type: Schema.Types.Mixed, default: [] },
    skills: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const User: Model<IUserDocument> =
  (mongoose?.models?.User as Model<IUserDocument>) ||
  (mongoose?.model ? mongoose.model<IUserDocument>('User', UserSchema) : ({} as Model<IUserDocument>));

