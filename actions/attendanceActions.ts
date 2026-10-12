'use server';

import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/mock-store';
import { LeaveRequest } from '@/types';
import { revalidatePath } from 'next/cache';

function mapRowToLeave(row: any): LeaveRequest {
  return {
    id: String(row.id),
    empId: row.emp_id,
    empName: row.emp_name || undefined,
    empTeam: row.emp_team || undefined,
    type: row.type as LeaveRequest['type'],
    from: row.from_date,
    to: row.to_date,
    days: Number(row.days || 1),
    half: Boolean(row.half),
    session: row.session || undefined,
    reason: row.reason || '',
    tl: (row.tl_status as 'approved' | 'rejected' | null) || null,
    ceo: (row.ceo_status as 'approved' | 'rejected' | null) || null,
    raised: row.raised_date || 'Just now',
    chat: Array.isArray(row.chat) ? row.chat : [],
  };
}

export async function fetchLeaveRequestsAction(): Promise<LeaveRequest[]> {
  try {
    const { data: rows, error } = await supabase
      .from('leave_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && rows) {
      return rows.map(mapRowToLeave);
    }
  } catch (e) {
    console.error('Error fetching leave requests from Supabase:', e);
  }

  return mockStore.leaveRequests;
}

export async function submitLeaveRequestAction(input: {
  empId: string;
  empName: string;
  empTeam: string;
  type: LeaveRequest['type'];
  from: string;
  to: string;
  days: number;
  half?: boolean;
  session?: 'Morning' | 'Afternoon';
  reason: string;
}): Promise<LeaveRequest> {
  const newId = `LR-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  const newReq: LeaveRequest = {
    id: newId,
    empId: input.empId,
    empName: input.empName,
    empTeam: input.empTeam,
    type: input.type,
    from: input.from,
    to: input.to,
    days: input.days,
    half: input.half,
    session: input.session,
    reason: input.reason || 'Not specified',
    tl: null,
    ceo: null,
    raised: 'Just now',
    chat: [],
  };

  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .upsert(
        {
          id: newReq.id,
          emp_id: newReq.empId,
          emp_name: newReq.empName,
          emp_team: newReq.empTeam,
          type: newReq.type,
          from_date: newReq.from,
          to_date: newReq.to,
          days: newReq.days,
          half: Boolean(newReq.half),
          session: newReq.session || null,
          reason: newReq.reason,
          tl_status: null,
          ceo_status: null,
          raised_date: newReq.raised,
          chat: [],
          created_at: nowIso,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (!error && data) {
      const mapped = mapRowToLeave(data);
      mockStore.leaveRequests.unshift(mapped);
      revalidatePath('/attendance');
      return mapped;
    }
  } catch (e) {
    console.error('Error submitting leave request to Supabase:', e);
  }

  mockStore.leaveRequests.unshift(newReq);
  revalidatePath('/attendance');
  return newReq;
}

export async function approveLeaveTLAction(id: string): Promise<LeaveRequest | null> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ tl_status: 'approved' })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const req = mockStore.leaveRequests.find((r) => r.id === id);
      if (req) req.tl = 'approved';
      revalidatePath('/attendance');
      return mapRowToLeave(data);
    }
  } catch (e) {
    console.error('Error approving leave (TL) in Supabase:', e);
  }

  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    req.tl = 'approved';
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}

export async function approveLeaveCEOAction(id: string): Promise<LeaveRequest | null> {
  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({ ceo_status: 'approved' })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const req = mockStore.leaveRequests.find((r) => r.id === id);
      if (req) req.ceo = 'approved';
      revalidatePath('/attendance');
      return mapRowToLeave(data);
    }
  } catch (e) {
    console.error('Error approving leave (CEO) in Supabase:', e);
  }

  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    req.ceo = 'approved';
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}

export async function rejectLeaveAction(id: string, byRole: 'tl' | 'ceo'): Promise<LeaveRequest | null> {
  const updatePayload = byRole === 'tl' ? { tl_status: 'rejected' } : { ceo_status: 'rejected' };

  try {
    const { data, error } = await supabase
      .from('leave_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const req = mockStore.leaveRequests.find((r) => r.id === id);
      if (req) {
        if (byRole === 'tl') req.tl = 'rejected';
        if (byRole === 'ceo') req.ceo = 'rejected';
      }
      revalidatePath('/attendance');
      return mapRowToLeave(data);
    }
  } catch (e) {
    console.error('Error rejecting leave in Supabase:', e);
  }

  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    if (byRole === 'tl') req.tl = 'rejected';
    if (byRole === 'ceo') req.ceo = 'rejected';
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}

export async function sendLeaveChatMessageAction(
  id: string,
  text: string,
  userRole: 'lead' | 'ceo',
  userName: string
): Promise<LeaveRequest | null> {
  const msgEntry = {
    role: userRole,
    who: userName,
    text,
    time: 'Just now',
  };

  try {
    const { data: existing } = await supabase
      .from('leave_requests')
      .select('chat')
      .eq('id', id)
      .single();

    const currentChat = Array.isArray(existing?.chat) ? existing.chat : [];
    const updatedChat = [...currentChat, msgEntry];

    const { data, error } = await supabase
      .from('leave_requests')
      .update({ chat: updatedChat })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const req = mockStore.leaveRequests.find((r) => r.id === id);
      if (req) {
        req.chat = req.chat || [];
        req.chat.push(msgEntry);
      }
      revalidatePath('/attendance');
      return mapRowToLeave(data);
    }
  } catch (e) {
    console.error('Error sending leave chat message in Supabase:', e);
  }

  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    req.chat = req.chat || [];
    req.chat.push(msgEntry);
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}
