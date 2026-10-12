import { Comment, User } from '@/types';
import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/mock-store';
import { getAllUsers } from './authService';

function mapRowToComment(row: any, allUsers: User[]): Comment {
  const user = allUsers.find((u) => u._id === row.user_id || u.email === row.user_id);
  return {
    _id: String(row.id),
    taskId: String(row.task_id),
    userId: String(row.user_id || ''),
    user,
    message: row.message || '',
    isInternal: Boolean(row.is_internal),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
  };
}

export async function getCommentsByTaskId(taskId: string): Promise<Comment[]> {
  const allUsers = await getAllUsers();

  try {
    const { data: rows, error } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (!error && rows) {
      return rows.map((r) => mapRowToComment(r, allUsers));
    }
  } catch (e) {
    console.error('Error fetching comments from Supabase:', e);
  }

  return mockStore.comments
    .filter((c) => c.taskId === taskId)
    .map((c) => ({
      ...c,
      user: c.user || allUsers.find((u) => u._id === c.userId),
    }));
}

export async function addComment(taskId: string, userId: string, message: string): Promise<Comment> {
  const allUsers = await getAllUsers();
  const user = allUsers.find((u) => u._id === userId || u.email === userId);
  const nowIso = new Date().toISOString();
  const newId = `comment_${Date.now()}`;

  const newComment: Comment = {
    _id: newId,
    taskId,
    userId: user?._id || userId,
    user,
    message,
    createdAt: nowIso,
  };

  try {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        id: newId,
        task_id: taskId,
        user_id: user?._id || userId,
        message,
        is_internal: false,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select('*')
      .single();

    if (!error && data) {
      mockStore.comments.push(newComment);
      const task = mockStore.tasks.find((t) => t._id === taskId);
      if (task) {
        task.commentsCount = (task.commentsCount || 0) + 1;
      }
      return mapRowToComment(data, allUsers);
    }
  } catch (e) {
    console.error('Error adding comment to Supabase:', e);
  }

  mockStore.comments.push(newComment);
  const task = mockStore.tasks.find((t) => t._id === taskId);
  if (task) {
    task.commentsCount = (task.commentsCount || 0) + 1;
  }

  return newComment;
}

export async function deleteComment(commentId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) {
      const index = mockStore.comments.findIndex((c) => c._id === commentId);
      if (index !== -1) mockStore.comments.splice(index, 1);
      return true;
    }
  } catch (e) {
    console.error('Error deleting comment in Supabase:', e);
  }

  const index = mockStore.comments.findIndex((c) => c._id === commentId);
  if (index !== -1) {
    mockStore.comments.splice(index, 1);
    return true;
  }
  return false;
}
