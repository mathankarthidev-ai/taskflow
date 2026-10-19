/**
 * File Security & MIME Whitelist Validation Utilities
 * Enforces strict 5MB file size limits and blocks malicious executables/scripts.
 */

export const ALLOWED_RECEIPT_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
];

export const PROHIBITED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.sh',
  '.cmd',
  '.js',
  '.vbs',
  '.scr',
  '.msi',
  '.ps1',
  '.jar',
  '.apk',
  '.com',
  '.pif',
  '.reg',
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates a receipt document name and data payload.
 */
export function validateReceiptAttachment(
  fileName?: string | null,
  fileUrlOrData?: string | null
): { valid: boolean; error?: string } {
  if (!fileName && !fileUrlOrData) {
    return { valid: true };
  }

  // 1. Check file extension if name is provided
  if (fileName) {
    const lowerName = fileName.toLowerCase().trim();
    
    // Check prohibited extensions
    const hasProhibited = PROHIBITED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (hasProhibited) {
      return {
        valid: false,
        error: `Security Violation: Executable and script files (${fileName}) are strictly prohibited.`,
      };
    }

    // Check allowed whitelist
    const hasAllowed = ALLOWED_RECEIPT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!hasAllowed && lowerName.includes('.')) {
      return {
        valid: false,
        error: `Unsupported file type: Only PDF, PNG, JPG, WEBP, and Office documents are permitted.`,
      };
    }
  }

  // 2. Check payload size if base64 Data URL
  if (fileUrlOrData && fileUrlOrData.startsWith('data:')) {
    // Base64 encoding expands size by ~33%. 5MB raw is ~6.9MB in base64
    const approxBytes = Math.round((fileUrlOrData.length * 3) / 4);
    if (approxBytes > MAX_FILE_SIZE_BYTES) {
      const mbSize = (approxBytes / (1024 * 1024)).toFixed(1);
      return {
        valid: false,
        error: `File size limit exceeded: Attachment is ${mbSize} MB (Maximum allowed is 5 MB).`,
      };
    }
  }

  return { valid: true };
}
