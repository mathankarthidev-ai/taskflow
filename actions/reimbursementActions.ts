'use server';

import { mockStore } from '@/lib/mock-store';
import { ReimbursementClaim, ClaimCategory, TeamName } from '@/types';
import { revalidatePath } from 'next/cache';

export async function fetchReimbursementsAction(): Promise<ReimbursementClaim[]> {
  return mockStore.reimbursements;
}

export async function submitReimbursementAction(input: {
  userId: string;
  userName: string;
  userTeam: TeamName;
  userAvatar?: string;
  category: ClaimCategory;
  amount: number;
  date: string;
  description: string;
  receiptName?: string;
}): Promise<ReimbursementClaim> {
  const claimNo = `CLM-${8045 + mockStore.reimbursements.length}`;
  const newClaim: ReimbursementClaim = {
    _id: `claim_${Date.now()}`,
    claimNo,
    userId: input.userId,
    userName: input.userName,
    userTeam: input.userTeam,
    userAvatar: input.userAvatar,
    category: input.category,
    amount: Number(input.amount),
    date: input.date,
    description: input.description,
    receiptName: input.receiptName || 'receipt_document.pdf',
    receiptUrl: '#',
    tlStatus: null,
    ceoStatus: null,
    isPaid: false,
    status: 'Pending TL',
    createdAt: new Date().toISOString(),
  };

  mockStore.reimbursements.unshift(newClaim);
  revalidatePath('/reimbursements');
  return newClaim;
}

export async function approveClaimTLAction(id: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.tlStatus = 'approved';
    claim.status = 'Pending CEO';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function approveClaimCEOAction(id: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.ceoStatus = 'approved';
    claim.status = 'Approved';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function markClaimPaidAction(id: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.isPaid = true;
    claim.status = 'Paid';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function rejectClaimAction(id: string, byRole: 'tl' | 'ceo'): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    if (byRole === 'tl') claim.tlStatus = 'rejected';
    if (byRole === 'ceo') claim.ceoStatus = 'rejected';
    claim.status = 'Rejected';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}
