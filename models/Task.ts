import mongoose, { Schema, Document, Model } from 'mongoose';
import { TaskStatus, TaskPriority, TeamName } from '@/types';

export interface ITaskDocument extends Document {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  team: TeamName;
  assignedTo?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  raisedBy?: mongoose.Types.ObjectId;
  incoming: boolean;
  dueDate: Date;
  labels: string[];
  attachments: { name: string; url: string; type: string }[];
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITaskDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Review', 'Support', 'Done'],
      default: 'Todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    team: {
      type: String,
      enum: ['Creative', 'Marketing', 'Development'],
      required: true,
      index: true,
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    incoming: { type: Boolean, default: false, index: true },
    dueDate: { type: Date, required: true },
    labels: [{ type: String }],
    attachments: [
      {
        name: { type: String },
        url: { type: String },
        type: { type: String, default: 'file' },
      },
    ],
  },
  { timestamps: true }
);

export const Task: Model<ITaskDocument> =
  (mongoose?.models?.Task as Model<ITaskDocument>) ||
  (mongoose?.model ? mongoose.model<ITaskDocument>('Task', TaskSchema) : ({} as Model<ITaskDocument>));
