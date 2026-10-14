'use server';

import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/mock-store';
import { ReimbursementClaim, ClaimCategory, TeamName, ExpenseItem, ClaimComment } from '@/types';
import { revalidatePath } from 'next/cache';

function mapClaimToRow(claim: ReimbursementClaim) {
  return {
    id: claim._id,
    claim_no: claim.claimNo,
    user_id: claim.userId,
    user_name: claim.userName,
    user_team: claim.userTeam,
    user_avatar: claim.userAvatar || null,
    company: claim.company || 'Ambizcon Health - India',
    category: claim.category,
    amount: Number(claim.amount || 0),
    date: claim.date,
    description: claim.description || '',
    receipt_name: claim.receiptName || null,
    receipt_url: claim.receiptUrl || null,
    items: claim.items || [],
    comments: claim.comments || [],
    rejection_reason: claim.rejectionReason || null,
    draft_saved_at: claim.draftSavedAt || null,
    admin_status: claim.adminStatus || null,
    tl_status: claim.tlStatus || null,
    ceo_status: claim.ceoStatus || null,
    is_paid: Boolean(claim.isPaid),
    status: claim.status,
    created_at: claim.createdAt || new Date().toISOString(),
  };
}

function mapRowToClaim(row: any): ReimbursementClaim {
  return {
    _id: String(row.id),
    claimNo: row.claim_no,
    userId: row.user_id,
    userName: row.user_name,
    userTeam: row.user_team as TeamName,
    userAvatar: row.user_avatar || undefined,
    company: row.company || 'Ambizcon Health - India',
    category: row.category as ClaimCategory,
    amount: Number(row.amount || 0),
    date: row.date,
    description: row.description || '',
    receiptName: row.receipt_name || undefined,
    receiptUrl: row.receipt_url || undefined,
    items: Array.isArray(row.items) ? row.items : [],
    comments: Array.isArray(row.comments) ? row.comments : [],
    rejectionReason: row.rejection_reason || undefined,
    draftSavedAt: row.draft_saved_at || undefined,
    adminStatus: (row.admin_status as 'approved' | 'rejected' | null) || null,
    tlStatus: (row.tl_status as 'approved' | 'rejected' | null) || null,
    ceoStatus: (row.ceo_status as 'approved' | 'rejected' | null) || null,
    isPaid: Boolean(row.is_paid),
    status: row.status as ReimbursementClaim['status'],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

export async function fetchReimbursementsAction(): Promise<ReimbursementClaim[]> {
  try {
    const { data: rows, error } = await supabase
      .from('reimbursements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && rows) {
      return rows.map(mapRowToClaim);
    }
  } catch (e) {
    console.error('Error fetching reimbursements from Supabase:', e);
  }

  return [];
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
  receiptUrl?: string;
  items?: ExpenseItem[];
  isDraft?: boolean;
}): Promise<ReimbursementClaim> {
  const claimNo = `CLM-${Math.floor(8045 + Math.random() * 900)}`;
  const isDraft = Boolean(input.isDraft);
  const calculatedTotal =
    input.items && input.items.length > 0
      ? input.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
      : Number(input.amount);
  const nowIso = new Date().toISOString();

  const newClaim: ReimbursementClaim = {
    _id: `claim_${Date.now()}`,
    claimNo,
    userId: input.userId,
    userName: input.userName,
    userTeam: input.userTeam,
    userAvatar: input.userAvatar,
    company: input.company || 'Ambizcon Health - India',
    category: input.category,
    amount: calculatedTotal,
    date: input.date,
    description: input.description,
    receiptName: input.receiptName || 'receipt_document.pdf',
    receiptUrl: input.receiptUrl || input.items?.[0]?.receiptUrl || '',
    items: input.items || [],
    comments: [],
    tlStatus: null,
    ceoStatus: null,
    isPaid: false,
    status: isDraft ? 'Draft' : 'Pending Approval',
    draftSavedAt: isDraft ? nowIso : undefined,
    createdAt: nowIso,
  };

  try {
    const row = mapClaimToRow(newClaim);
    const { data, error } = await supabase
      .from('reimbursements')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (!error && data) {
      const mapped = mapRowToClaim(data);
      mockStore.reimbursements.unshift(mapped);
      revalidatePath('/reimbursements');
      return mapped;
    }
  } catch (e) {
    console.error('Error submitting reimbursement to Supabase:', e);
  }

  mockStore.reimbursements.unshift(newClaim);
  revalidatePath('/reimbursements');
  return newClaim;
}

export async function submitDraftClaimAction(id: string): Promise<ReimbursementClaim | null> {
  try {
    const { data, error } = await supabase
      .from('reimbursements')
      .update({ status: 'Pending Approval', draft_saved_at: null })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const claim = mockStore.reimbursements.find((c) => c._id === id);
      if (claim) {
        claim.status = 'Pending Approval';
        claim.draftSavedAt = undefined;
      }
      revalidatePath('/reimbursements');
      return mapRowToClaim(data);
    }
  } catch (e) {
    console.error('Error submitting draft claim in Supabase:', e);
  }

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
  try {
    const { data, error } = await supabase
      .from('reimbursements')
      .update({ status: 'Cancelled' })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const claim = mockStore.reimbursements.find((c) => c._id === id);
      if (claim) claim.status = 'Cancelled';
      revalidatePath('/reimbursements');
      return mapRowToClaim(data);
    }
  } catch (e) {
    console.error('Error cancelling claim in Supabase:', e);
  }

  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim && (claim.status === 'Draft' || claim.status === 'Pending Approval')) {
    claim.status = 'Cancelled';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function approveClaimAdminAction(id: string): Promise<ReimbursementClaim | null> {
  try {
    const { data, error } = await supabase
      .from('reimbursements')
      .update({
        admin_status: 'approved',
        ceo_status: 'approved',
        status: 'Approved',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const claim = mockStore.reimbursements.find((c) => c._id === id);
      if (claim) {
        claim.adminStatus = 'approved';
        claim.ceoStatus = 'approved';
        claim.status = 'Approved';
      }
      revalidatePath('/reimbursements');
      return mapRowToClaim(data);
    }
  } catch (e) {
    console.error('Error approving claim in Supabase:', e);
  }

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
  try {
    const { data, error } = await supabase
      .from('reimbursements')
      .update({
        is_paid: true,
        status: 'Paid',
      })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const claim = mockStore.reimbursements.find((c) => c._id === id);
      if (claim) {
        claim.isPaid = true;
        claim.status = 'Paid';
      }
      revalidatePath('/reimbursements');
      return mapRowToClaim(data);
    }
  } catch (e) {
    console.error('Error marking claim paid in Supabase:', e);
  }

  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.isPaid = true;
    claim.status = 'Paid';
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function rejectClaimAction(
  id: string,
  byRole?: 'tl' | 'ceo' | 'admin',
  reason?: string
): Promise<ReimbursementClaim | null> {
  try {
    const { data: existing } = await supabase
      .from('reimbursements')
      .select('comments')
      .eq('id', id)
      .single();

    const currentComments: ClaimComment[] = Array.isArray(existing?.comments) ? existing.comments : [];
    if (reason) {
      currentComments.push({
        id: `cmt_${Date.now()}`,
        authorName: 'Admin / Finance',
        authorRole: 'Admin',
        text: `Claim Rejected. Reason: ${reason}`,
        createdAt: new Date().toISOString(),
      });
    }

    const { data, error } = await supabase
      .from('reimbursements')
      .update({
        admin_status: 'rejected',
        tl_status: 'rejected',
        ceo_status: 'rejected',
        status: 'Rejected',
        rejection_reason: reason || null,
        comments: currentComments,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const claim = mockStore.reimbursements.find((c) => c._id === id);
      if (claim) {
        claim.adminStatus = 'rejected';
        claim.tlStatus = 'rejected';
        claim.ceoStatus = 'rejected';
        claim.status = 'Rejected';
        if (reason) {
          claim.rejectionReason = reason;
          claim.comments = currentComments;
        }
      }
      revalidatePath('/reimbursements');
      return mapRowToClaim(data);
    }
  } catch (e) {
    console.error('Error rejecting claim in Supabase:', e);
  }

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
  const newComment: ClaimComment = {
    id: `cmt_${Date.now()}`,
    authorName,
    authorRole,
    text,
    createdAt: new Date().toISOString(),
  };

  try {
    const { data: existing } = await supabase
      .from('reimbursements')
      .select('comments')
      .eq('id', id)
      .single();

    const currentComments: ClaimComment[] = Array.isArray(existing?.comments) ? existing.comments : [];
    const updatedComments = [...currentComments, newComment];

    const { data, error } = await supabase
      .from('reimbursements')
      .update({ comments: updatedComments })
      .eq('id', id)
      .select('*')
      .single();

    if (!error && data) {
      const claim = mockStore.reimbursements.find((c) => c._id === id);
      if (claim) {
        claim.comments = updatedComments;
      }
      revalidatePath('/reimbursements');
      return mapRowToClaim(data);
    }
  } catch (e) {
    console.error('Error adding claim comment in Supabase:', e);
  }

  const claim = mockStore.reimbursements.find((c) => c._id === id);
  if (claim) {
    claim.comments = claim.comments || [];
    claim.comments.push(newComment);
    revalidatePath('/reimbursements');
    return { ...claim };
  }
  return null;
}

export async function updateReimbursementAction(
  claimId: string,
  input: {
    category?: ClaimCategory;
    amount?: number;
    date?: string;
    description?: string;
    receiptName?: string;
    receiptUrl?: string;
    items?: ExpenseItem[];
  }
): Promise<ReimbursementClaim | null> {
  try {
    const { data: existing } = await supabase
      .from('reimbursements')
      .select('*')
      .eq('id', claimId)
      .single();

    if (existing) {
      if (
        existing.status === 'Approved' ||
        existing.status === 'Paid' ||
        existing.admin_status === 'approved'
      ) {
        throw new Error('Approved claims cannot be edited.');
      }

      const calculatedTotal =
        input.items && input.items.length > 0
          ? input.items.reduce((sum, item) => sum + Number(item.amount || 0), 0)
          : Number(input.amount || existing.amount || 0);

      const primaryReceiptName =
        input.receiptName !== undefined
          ? input.receiptName
          : input.items?.[0]?.receiptName || '';
      const primaryReceiptUrl =
        input.receiptUrl !== undefined
          ? input.receiptUrl
          : input.items?.[0]?.receiptUrl || '';

      const updatedFields: any = {
        category: input.category || existing.category,
        amount: calculatedTotal,
        date: input.date || existing.date,
        description: input.description !== undefined ? input.description : existing.description,
        receipt_name: primaryReceiptName,
        receipt_url: primaryReceiptUrl,
        items: input.items || existing.items || [],
      };

      const { data: updated, error: updateErr } = await supabase
        .from('reimbursements')
        .update(updatedFields)
        .eq('id', claimId)
        .select('*')
        .single();

      if (!updateErr && updated) {
        const claim = mockStore.reimbursements.find((c) => c._id === claimId);
        if (claim) {
          Object.assign(claim, {
            category: updatedFields.category,
            amount: updatedFields.amount,
            date: updatedFields.date,
            description: updatedFields.description,
            receiptName: updatedFields.receipt_name,
            receiptUrl: updatedFields.receipt_url,
            items: updatedFields.items,
          });
        }
        revalidatePath('/reimbursements');
        return mapRowToClaim(updated);
      }
    }
  } catch (e) {
    console.error('Error updating reimbursement in Supabase:', e);
  }

  const claim = mockStore.reimbursements.find((c) => c._id === claimId);
  if (claim && claim.status !== 'Approved' && claim.status !== 'Paid') {
    if (input.category) claim.category = input.category;
    if (input.amount !== undefined) claim.amount = input.amount;
    if (input.date) claim.date = input.date;
    if (input.description !== undefined) claim.description = input.description;
    if (input.receiptName !== undefined) claim.receiptName = input.receiptName;
    if (input.receiptUrl !== undefined) claim.receiptUrl = input.receiptUrl;
    if (input.items) claim.items = input.items;
    revalidatePath('/reimbursements');
    return { ...claim };
  }

  return null;
}
