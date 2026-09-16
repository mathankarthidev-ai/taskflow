import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const breakType = body.breakType || 'Lunch';

    return NextResponse.json({
      success: true,
      message: `Ended ${breakType} break! Resumed shift work.`,
    });
  } catch (error) {
    return NextResponse.json({ success: false, code: 'SERVER_ERROR', message: 'Internal Server Error' }, { status: 500 });
  }
}
