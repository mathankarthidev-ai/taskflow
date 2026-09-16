'use server';

import { mockStore } from '@/lib/mock-store';
import { LeaveRequest } from '@/types';
import { revalidatePath } from 'next/cache';

export async function fetchLeaveRequestsAction(): Promise<LeaveRequest[]> {
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
  const newReq: LeaveRequest = {
    id: `LR-${1044 + mockStore.leaveRequests.length}`,
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

  mockStore.leaveRequests.unshift(newReq);
  revalidatePath('/attendance');
  return newReq;
}

export async function approveLeaveTLAction(id: string): Promise<LeaveRequest | null> {
  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    req.tl = 'approved';
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}

export async function approveLeaveCEOAction(id: string): Promise<LeaveRequest | null> {
  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    req.ceo = 'approved';
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}

export async function rejectLeaveAction(id: string, byRole: 'tl' | 'ceo'): Promise<LeaveRequest | null> {
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
  const req = mockStore.leaveRequests.find((r) => r.id === id);
  if (req) {
    req.chat = req.chat || [];
    req.chat.push({
      role: userRole,
      who: userName,
      text,
      time: 'Just now',
    });
    revalidatePath('/attendance');
    return { ...req };
  }
  return null;
}
