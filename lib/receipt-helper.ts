/**
 * Receipt Helper:
 * If an authentic user-uploaded receipt or bill exists (data URL or remote HTTP URL), returns that URL.
 * Otherwise returns an empty string (no auto-generated or synthetic demo bills).
 */
export function getReceiptImageUrl(
  _receiptName?: string,
  receiptUrl?: string,
  _details?: {
    claimNo?: string;
    category?: string;
    amount?: number;
    date?: string;
    userName?: string;
    description?: string;
  }
): string {
  if (
    receiptUrl &&
    (receiptUrl.startsWith('data:image') ||
      receiptUrl.startsWith('data:application/pdf') ||
      receiptUrl.startsWith('http://') ||
      receiptUrl.startsWith('https://') ||
      receiptUrl.startsWith('/'))
  ) {
    return receiptUrl;
  }

  // Never auto-generate fake bills. Keep empty if not attached by the user.
  return '';
}
