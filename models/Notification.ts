import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

export const Notification: Model<INotificationDocument> =
  (mongoose?.models?.Notification as Model<INotificationDocument>) ||
  (mongoose?.model ? mongoose.model<INotificationDocument>('Notification', NotificationSchema) : ({} as Model<INotificationDocument>));
