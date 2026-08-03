import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICommentDocument extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<ICommentDocument>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Comment: Model<ICommentDocument> =
  (mongoose?.models?.Comment as Model<ICommentDocument>) ||
  (mongoose?.model ? mongoose.model<ICommentDocument>('Comment', CommentSchema) : ({} as Model<ICommentDocument>));
