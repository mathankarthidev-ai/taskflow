import { NextResponse } from 'next/server';

export async function GET() {
  // Mock authenticated user retrieval (simulates existing TaskFlow auth session)
  return NextResponse.json({
    id: 'user_anirudh_01',
    name: 'Anirudh K.',
    email: 'anirudh@ambizcon.com',
    role: 'Super Admin',
    team: 'Development',
    workMode: 'Work From Office',
  });
}
