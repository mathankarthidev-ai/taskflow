import mongoose, { Schema, Document, Model } from 'mongoose';
import { TeamName } from '@/types';

export interface ITeamDocument extends Document {
  name: TeamName;
  code: string;
  description: string;
  leadId?: mongoose.Types.ObjectId;
}

const TeamSchema = new Schema<ITeamDocument>(
  {
    name: {
      type: String,
      enum: ['Creative', 'Marketing', 'Development'],
      required: true,
      unique: true,
    },
    code: { type: String, required: true, uppercase: true },
    description: { type: String, default: '' },
    leadId: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Team: Model<ITeamDocument> =
  (mongoose?.models?.Team as Model<ITeamDocument>) ||
  (mongoose?.model ? mongoose.model<ITeamDocument>('Team', TeamSchema) : ({} as Model<ITeamDocument>));
