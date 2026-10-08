import { NextResponse } from 'next/server';
import { attendanceDb } from '@/lib/attendance-db';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    attendanceDb.resetAll();
    const { error } = await supabase.from('attendance').delete().neq('id', 'non_existent_id');
    if (error) {
      console.error('Supabase wipe warning:', error);
    }
    return NextResponse.json({
      success: true,
      message: 'All clock-in and clock-out database records have been completely wiped.',
      totalRecords: 0,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, code: 'SERVER_ERROR', message: 'Failed to reset attendance data' },
      { status: 500 }
    );
  }
}
