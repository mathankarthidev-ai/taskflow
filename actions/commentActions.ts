'use server';

import { addComment, deleteComment, getCommentsByTaskId } from '@/services/commentService';
import { revalidatePath } from 'next/cache';

export async function fetchCommentsAction(taskId: string) {
  return await getCommentsByTaskId(taskId);
}

export async function addCommentAction(taskId: string, userId: string, message: string) {
  const comment = await addComment(taskId, userId, message);
  revalidatePath(`/tasks/${taskId}`);
  revalidatePath('/kanban');
  return comment;
}

export async function deleteCommentAction(commentId: string, taskId: string) {
  const success = await deleteComment(commentId);
  revalidatePath(`/tasks/${taskId}`);
  return success;
}
