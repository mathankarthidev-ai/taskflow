'use server';

import { mockStore } from '@/lib/mock-store';
import { ReimbursementClaim, ClaimCategory, TeamName, ExpenseItem, ClaimComment } from '@/types';
import { revalidatePath } from 'next/cache';

export async function fetchReimbursementsAction(): Promise<ReimbursementClaim[]> {
  return mockStore.reimbursements;
}

export async function submitReimbursementAction(input: {
  userId: string;
  userName: string;
  userTeam: TeamName;
  userAvatar?: string;
  company?: string;
  category: ClaimCategory;
  amount: number;
  date: string;
  description: string;
  receiptName?: string;
  items?: ExpenseItem[];
  isDraft?: boolean;
}): Promise<ReimbursementClaim> {
  const claimNo = `CLM-${8045 + mockStore.reimbursements.length}`;
  const isDraft = Boolean(input.isDraft);
  const calculatedTotal = input.items && input.items.length > 0
    ? input.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : Number(input.amount);

  const newClaim: ReimbursementClaim = {
    _id: `claim_${Date.now()}`,
    claimNo,
    userId: input.userId,
    userName: input.userName,
    userTeam: input.userTeam,
    userAvatar: input.userAvatar,
    company: input.company,
    category: input.category,
    amount: calculatedTotal,
    date: input.date,
    description: input.description,
    receiptName: input.receiptName || 'receipt_document.pdf',
    receiptUrl: '#',
    items: input.items || [],
    comments: [],
    tlStatus: null,
    ceoStatus: null,
    isPaid: false,
    status: isDraft ? 'Draft' : 'Pending Approval',
    draftSavedAt: isDraft ? new Date().toISOString() : undefined,
    createdAt: new Date().toISOString(),
  };

  mockStore.reimbursements.unshift(newClaim);
  revalidatePath('/reimbursements');
  return newClaim;
}

export async function submitDraftClaimAction(id: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim && claim.status === 'Draft') {
    claim.status = 'Pending Approval';
    claim.draftSavedAt = undefined;
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function cancelClaimAction(id: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim && (claim.status === 'Draft' || claim.status === 'Pending Approval')) {
    claim.status = 'Cancelled';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function approveClaimAdminAction(id: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.adminStatus = 'approved';
    claim.ceoStatus = 'approved';
    claim.status = 'Approved';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function approveClaimTLAction(id: string): Promise<ReimbursementClaim | null> {
  return approveClaimAdminAction(id);
}

export async function approveClaimCEOAction(id: string): Promise<ReimbursementClaim | null> {
  return approveClaimAdminAction(id);
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

export async function rejectClaimAction(id: string, byRole?: 'tl' | 'ceo' | 'admin', reason?: string): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.adminStatus = 'rejected';
    claim.tlStatus = 'rejected';
    claim.ceoStatus = 'rejected';
    claim.status = 'Rejected';
    if (reason) {
      claim.rejectionReason = reason;
      claim.comments = claim.comments || [];
      claim.comments.push({
        id: `cmt_${Date.now()}`,
        authorName: 'Admin / Finance',
        authorRole: 'Admin',
        text: `Claim Rejected. Reason: ${reason}`,
        createdAt: new Date().toISOString(),
      });
    }
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function addClaimCommentAction(
  id: string,
  authorName: string,
  authorRole: string,
  text: string
): Promise<ReimbursementClaim | null> {
  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.comments = claim.comments || [];
    claim.comments.push({
      id: `cmt_${Date.now()}`,
      authorName,
      authorRole,
      text,
      createdAt: new Date().toISOString(),
    });
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}
