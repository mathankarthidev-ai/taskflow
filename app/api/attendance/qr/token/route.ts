import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const branch = searchParams.get('branch') || 'Ambizcon Health - India';
    const isAus = branch.includes('Australia');

    const now = Date.now();
    const expiresIn = 10; // 10 seconds TTL
    const expiresAt = now + expiresIn * 1000;
    const nonce = Math.random().toString(36).substring(2, 8).toUpperCase();
    const tokenId = `AMB-QR-${now.toString(36).toUpperCase()}-${nonce}`;

    const payload = {
      tokenId,
      branch: isAus ? 'Ambizcon' : 'Ambizcon Health - India',
      authorizedIp: isAus ? '103.246.40.112' : '192.168.1.104',
      location: isAus ? 'Queen Street, Brisbane CBD, Australia' : 'Anna Nagar, Chennai',
      issuedAt: now,
      expiresAt,
      ttl: expiresIn,
    };

    return NextResponse.json({
      success: true,
      token: payload,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Failed to generate QR token' },
      { status: 500 }
    );
  }
}
