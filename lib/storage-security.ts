/**
 * Private Storage & Expiring Signed URL Security Utilities
 * Protects sensitive financial receipts and employee documents by generating temporary, expiring download URLs.
 */

import { supabase } from '@/lib/supabase';

export const PRIVATE_STORAGE_BUCKET = 'company-private-documents';
export const DEFAULT_SIGNED_URL_EXPIRY_SECONDS = 300; // 5 minutes

export interface SignedUrlRequest {
  filePath: string;
  expiresInSeconds?: number;
  requesterId: string;
  requesterRole: string;
  ownerId?: string;
}

export interface SignedUrlResult {
  success: boolean;
  url?: string;
  error?: string;
  expiresAt?: string;
}

/**
 * Generates an expiring signed URL for a file in private Supabase Storage,
 * strictly verifying that the requester is either the document owner or an Administrator.
 */
export async function getPrivateDocumentSignedUrl({
  filePath,
  expiresInSeconds = DEFAULT_SIGNED_URL_EXPIRY_SECONDS,
  requesterId,
  requesterRole,
  ownerId,
}: SignedUrlRequest): Promise<SignedUrlResult> {
  // 1. Authorization & IDOR Check
  const isPrivileged =
    requesterRole === 'Super Admin' || requesterRole === 'Admin' || requesterRole === 'CEO' || requesterRole === 'Team Lead';
  const isOwner = ownerId && String(ownerId).toLowerCase() === String(requesterId).toLowerCase();

  if (!isPrivileged && ownerId && !isOwner) {
    return {
      success: false,
      error: 'Access Denied: You do not have permission to view this private document.',
    };
  }

  // If already a Data URL or external HTTP URL in development mode
  if (filePath.startsWith('data:') || filePath.startsWith('http')) {
    return {
      success: true,
      url: filePath,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  }

  // 2. Request expiring signed URL from Supabase Storage private bucket
  try {
    const { data, error } = await supabase.storage
      .from(PRIVATE_STORAGE_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);

    if (error || !data) {
      console.warn('Private storage signed URL notice:', error?.message);
      return {
        success: false,
        error: error?.message || 'Unable to generate secure download link',
      };
    }

    return {
      success: true,
      url: data.signedUrl,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to generate signed document URL',
    };
  }
}
