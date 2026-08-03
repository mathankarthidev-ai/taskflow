import { Comment } from '@/types';
import { connectDB } from '@/lib/db';
import { Comment as CommentModel } from '@/models/Comment';
import { mockStore } from '@/lib/mock-store';
import { getAllUsers } from './authService';

export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const db = await connectDB();

  if (db) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const docs: any = await CommentModel.find({ taskId })
        .populate('userId')
        .sort({ createdAt: 1 })
        .lean();

      if (docs.length >= 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return docs.map((doc: any) => ({
          _id: doc._id.toString(),
          taskId: doc.taskId.toString(),
          userId: doc.userId?._id?.toString() || '',
          user: doc.userId ? {
            _id: doc.userId._id.toString(),
            name: doc.userId.name,
            email: doc.userId.email,
            role: doc.userId.role,
            team: doc.userId.team,
            avatar: doc.userId.avatar,
          } : undefined,
          message: doc.message,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,
        }));
      }
    } catch (e) {
      console.error('Error fetching comments from DB:', e);
    }
  }

  const allUsers = await getAllUsers();
  return mockStore.comments
    .filter((c) => c.taskId === taskId)
    .map((c) => ({
      ...c,
      user: c.user || allUsers.find((u) => u._id === c.userId),
    }));
}

export async function addComment(taskId: string, userId: string, message: string): Promise<Comment> {
  const db = await connectDB();
  const allUsers = await getAllUsers();
  const user = allUsers.find((u) => u._id === userId || u.email === userId);

  if (db) {
    try {
      const created = await CommentModel.create({
        taskId,
        userId: user?._id,
        message,
      });

      return {
        _id: created._id.toString(),
        taskId,
        userId: user?._id || userId,
        user,
        message: created.message,
        createdAt: created.createdAt.toISOString(),
      };
    } catch (e) {
      console.error('Error adding comment to DB:', e);
    }
  }

  const newComment: Comment = {
    _id: `comment_${Date.now()}`,
    taskId,
    userId: user?._id || userId,
    user,
    message,
    createdAt: new Date().toISOString(),
  };

  mockStore.comments.push(newComment);

  // Update task commentsCount in mockStore
  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    task.commentsCount = (task.commentsCount || 0) + 1;
  }

  return newComment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  const db = await connectDB();

  if (db) {
    try {
      await CommentModel.findByIdAndDelete(commentId);
      return true;
    } catch (e) {
      console.error('Error deleting comment in DB:', e);
    }
  }

  const index = mockStore.comments.findIndex((c) => c._id === commentId);
  if (index !== -1) {
    mockStore.comments.splice(index, 1);
    return true;
  }
  return false;
}
