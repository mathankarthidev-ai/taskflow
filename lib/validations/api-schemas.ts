import { z } from 'zod';

/**
 * Zod validation schema for Dynamic QR Attendance Scan
 */
export const QrScanInputSchema = z.object({
  tokenId: z.string().min(5, 'Token ID is required').max(100),
  userId: z.string().min(1, 'User ID is required').max(120),
  userName: z.string().min(1, 'User name is required').max(120),
  userEmail: z.string().email('Invalid user email format').optional(),
  userTeam: z.string().max(80).optional(),
  branch: z.string().max(80).optional(),
  expiresAt: z.number().int().positive().optional(),
});

/**
 * Zod validation schema for Manual / Kiosk Attendance Clock-In
 */
export const ClockInInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required').max(120),
  userName: z.string().min(1, 'User name is required').max(120),
  userEmail: z.string().email('Invalid email').optional(),
  team: z.string().max(80).optional(),
  workMode: z.enum(['Work From Office', 'Work From Home', 'Hybrid', 'Client Site']).optional(),
  location: z.string().max(150).optional(),
});

/**
 * Zod validation schema for Attendance Breaks (Start/End)
 */
export const BreakActionSchema = z.object({
  attendanceId: z.string().min(1, 'Attendance ID is required').max(100),
  userId: z.string().min(1, 'User ID is required').max(120),
  breakType: z.enum(['Lunch', 'Tea', 'Personal', 'Meeting']),
});

/**
 * Zod validation schema for Internal Team Chat Messages
 */
export const ChatMessageInputSchema = z.object({
  senderId: z.string().min(1, 'Sender ID is required').max(120),
  senderName: z.string().min(1, 'Sender name is required').max(120),
  senderRole: z.string().max(60).optional(),
  recipientId: z.string().max(120).optional(),
  channelId: z.string().max(100).optional(),
  message: z.string().min(1, 'Message cannot be empty').max(3000, 'Message cannot exceed 3000 characters'),
  attachmentUrl: z.string().url('Invalid attachment URL').optional().or(z.literal('')),
});

/**
 * Helper to safely validate an incoming JSON request body against a Zod schema.
 */
export function validateRequestBody<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
} {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.errors[0]?.message || 'Invalid request payload';
  return { success: false, error: firstError };
}
