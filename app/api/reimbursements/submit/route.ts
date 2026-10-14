import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mockStore } from '@/lib/mock-store';
import { ReimbursementClaim, ClaimCategory, TeamName, ExpenseItem } from '@/types';
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

export async function POST(req: Request) {
  try {
    const input = await req.json();

    const claimNo = `CLM-${Math.floor(8045 + Math.random() * 900)}`;
    const isDraft = Boolean(input.isDraft);
    const calculatedTotal =
      input.items && input.items.length > 0
        ? input.items.reduce((sum: number, item: any) => sum + Number(item.amount || 0), 0)
        : Number(input.amount || 0);
    const nowIso = new Date().toISOString();

    const primaryReceiptName =
      input.receiptName || input.items?.[0]?.receiptName || 'receipt_document.pdf';
    const primaryReceiptUrl =
      input.receiptUrl || input.items?.[0]?.receiptUrl || '';

    const newClaim: ReimbursementClaim = {
      _id: `claim_${Date.now()}`,
      claimNo,
      userId: input.userId || 'usr_unknown',
      userName: input.userName || 'Team Member',
      userTeam: (input.userTeam as TeamName) || 'Development',
      userAvatar: input.userAvatar,
      company: input.company || 'Ambizcon Health - India',
      category: input.category || 'Other',
      amount: calculatedTotal,
      date: input.date || nowIso.split('T')[0],
      description: input.description || '',
      receiptName: primaryReceiptName,
      receiptUrl: primaryReceiptUrl,
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
        return NextResponse.json({ success: true, claim: mapped });
      }

      if (error) {
        console.error('Supabase upsert error in /api/reimbursements/submit:', error);
      }
    } catch (dbErr) {
      console.error('Database error in /api/reimbursements/submit:', dbErr);
    }

    mockStore.reimbursements.unshift(newClaim);
    revalidatePath('/reimbursements');
    return NextResponse.json({ success: true, claim: newClaim });
  } catch (err: any) {
    console.error('POST /api/reimbursements/submit error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to submit reimbursement claim' },
      { status: 500 }
    );
  }
}
