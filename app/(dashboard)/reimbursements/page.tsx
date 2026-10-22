'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ReimbursementClaim, ClaimCategory, ClaimStatus, ExpenseItem, ClaimComment } from '@/types';
import {
  fetchReimbursementsAction,
  submitReimbursementAction,
  submitDraftClaimAction,
  cancelClaimAction,
  approveClaimAdminAction,
  markClaimPaidAction,
  rejectClaimAction,
  addClaimCommentAction,
  updateReimbursementAction,
} from '@/actions/reimbursementActions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import {
  Receipt,
  Plus,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign,
  ArrowRight,
  Shield,
  CreditCard,
  Building2,
  TrendingUp,
  Search,
  Filter,
  Layers,
  Trash2,
  Edit,
  Clock,
  XCircle,
  MessageSquare,
  Paperclip,
  Eye,
  SlidersHorizontal,
  Settings,
  Calendar,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Bell,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store/useCompanyStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getReceiptImageUrl } from '@/lib/receipt-helper';
import { isUserInCompany } from '@/lib/company-filter';

const DEFAULT_CATEGORIES = [
  'Client Lunch',
  'Travel',
  'Software',
  'Equipment',
  'Office Supplies',
  'Medical',
];

const CLAIMS_STORAGE_KEY = 'ambizcon_reimbursement_claims_v3';

function purgeLegacyClaims() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('ambizcon_reimbursement_claims_v1');
    localStorage.removeItem('ambizcon_reimbursement_claims_v2');
  } catch (_) {}
}

function getLocalYMD(daysAgo = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function doesClaimMatchDateRange(
  claim: ReimbursementClaim,
  rangeOption: 'All Time' | 'Today' | 'This Week' | 'This Month' | 'Custom',
  startDate?: string,
  endDate?: string
): boolean {
  if (rangeOption === 'All Time') return true;
  const claimDate = claim.date || (claim.createdAt ? claim.createdAt.split('T')[0] : '');
  if (!claimDate) return false;

  const todayStr = getLocalYMD(0);
  if (rangeOption === 'Today') {
    return claimDate === todayStr;
  }
  if (rangeOption === 'This Week') {
    const sevenDaysAgoStr = getLocalYMD(7);
    return claimDate >= sevenDaysAgoStr && claimDate <= todayStr;
  }
  if (rangeOption === 'This Month') {
    const thirtyDaysAgoStr = getLocalYMD(30);
    const currentYearMonth = todayStr.substring(0, 7);
    return claimDate.startsWith(currentYearMonth) || (claimDate >= thirtyDaysAgoStr && claimDate <= todayStr);
  }
  if (rangeOption === 'Custom') {
    if (startDate && claimDate < startDate) return false;
    if (endDate && claimDate > endDate) return false;
    return true;
  }
  return true;
}

function saveClaimsToStorage(claims: ReimbursementClaim[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CLAIMS_STORAGE_KEY, JSON.stringify(claims));
  } catch {
    // ignore storage quota errors
  }
}

function mergeClaimsWithStorage(serverClaims: ReimbursementClaim[]): ReimbursementClaim[] {
  if (typeof window === 'undefined') return serverClaims;
  try {
    const raw = localStorage.getItem(CLAIMS_STORAGE_KEY);
    if (!raw) return serverClaims;
    const stored: ReimbursementClaim[] = JSON.parse(raw);
    if (!Array.isArray(stored) || stored.length === 0) return serverClaims;

    const map = new Map<string, ReimbursementClaim>();
    serverClaims
      .filter((c) => !String(c._id).startsWith('claim_seed_'))
      .forEach((c) => map.set(c._id, c));

    const nowMs = Date.now();
    stored
      .filter((sc) => !String(sc._id).startsWith('claim_seed_'))
      .forEach((sc) => {
        const existing = map.get(sc._id);
        if (!existing) {
          // Only keep optimistic local claims created within the last 15 seconds
          const createdMs = sc.createdAt ? new Date(sc.createdAt).getTime() : 0;
          if (createdMs && nowMs - createdMs < 15000) {
            map.set(sc._id, sc);
          }
        } else {
          const mergedComments =
            (sc.comments?.length || 0) >= (existing.comments?.length || 0)
              ? sc.comments
              : existing.comments;
          map.set(sc._id, {
            ...sc,
            ...existing,
            comments: mergedComments || [],
          });
        }
      });
    return Array.from(map.values());
  } catch {
    return serverClaims;
  }
}

export default function ReimbursementsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const isTeamLead = currentUser?.role === 'Team Lead';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';

  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline Quick Note State on Ledger Cards
  const [inlineNoteClaimId, setInlineNoteClaimId] = useState<string | null>(null);
  const [inlineNoteInput, setInlineNoteInput] = useState('');

  // Custom Categories state
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ClaimStatus | 'All'>('All');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_high' | 'amount_low'>('newest');

  // Date Range Filter (Daily, Weekly, Monthly, Custom)
  const [dateRangeOption, setDateRangeOption] = useState<'All Time' | 'Today' | 'This Week' | 'This Month' | 'Custom'>('All Time');
  const [customStartDate, setCustomStartDate] = useState(() => getLocalYMD(30));
  const [customEndDate, setCustomEndDate] = useState(() => getLocalYMD(0));

  // Custom Download / Export CSV Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportRangeOption, setExportRangeOption] = useState<'All Time' | 'Today' | 'This Week' | 'This Month' | 'Custom'>('All Time');
  const [exportStartDate, setExportStartDate] = useState(() => getLocalYMD(30));
  const [exportEndDate, setExportEndDate] = useState(() => getLocalYMD(0));
  const [exportStatusFilter, setExportStatusFilter] = useState<'All' | 'Paid & Settled' | 'Pending Signoff' | 'Approved' | 'Rejected'>('All');
  const [exportCategoryFilter, setExportCategoryFilter] = useState<string>('All');
  const [exportIncludeSummary, setExportIncludeSummary] = useState<boolean>(true);

  // Submit & Edit Claim Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [editingClaim, setEditingClaim] = useState<ReimbursementClaim | null>(null);

  const handleOpenCreateModal = () => {
    setEditingClaim(null);
    setItems([
      {
        category: categoriesList[0] || 'Client Lunch',
        customCategoryName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receiptName: '',
        receiptUrl: '',
      },
    ]);
    setIsSubmitModalOpen(true);
  };

  const handleOpenEditModal = (claim: ReimbursementClaim) => {
    const isApprovedOrPaid =
      claim.status === 'Approved' || claim.status === 'Paid' || claim.adminStatus === 'approved';
    if (isApprovedOrPaid) {
      toast.error('Approved claims cannot be edited.');
      return;
    }

    setEditingClaim(claim);
    const claimItems =
      Array.isArray(claim.items) && claim.items.length > 0
        ? claim.items.map((it) => ({
            category: it.category || 'Client Lunch',
            customCategoryName: '',
            amount: String(it.amount || ''),
            date: it.date || new Date().toISOString().split('T')[0],
            description: it.description || '',
            receiptName: it.receiptName || '',
            receiptUrl: it.receiptUrl || '',
          }))
        : [
            {
              category: claim.category || 'Client Lunch',
              customCategoryName: '',
              amount: String(claim.amount || ''),
              date: claim.date || new Date().toISOString().split('T')[0],
              description: claim.description || '',
              receiptName: claim.receiptName || '',
              receiptUrl: claim.receiptUrl || '',
            },
          ];
    setItems(claimItems);
    setIsSubmitModalOpen(true);
  };
  const [items, setItems] = useState<
    {
      category: string;
      customCategoryName?: string;
      amount: string;
      date: string;
      description: string;
      receiptName: string;
      receiptUrl?: string;
    }[]
  >([
    {
      category: 'Client Lunch',
      customCategoryName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receiptName: '',
      receiptUrl: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail & Comments Modal & Inline Receipt Zoom Viewer
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<ReimbursementClaim | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [imageZoom, setImageZoom] = useState<number>(1);
  const [imageRotation, setImageRotation] = useState<number>(0);
  const [expandedReceiptIdx, setExpandedReceiptIdx] = useState<number | null>(0);

  const handleOpenClaimDetails = (claim: ReimbursementClaim) => {
    setSelectedClaimDetail(claim);
    // Expand the first item's receipt immediately right there inside the modal
    setExpandedReceiptIdx(0);
    setImageZoom(1);
    setImageRotation(0);
  };

  // Rejection Reason Modal
  const [rejectionModalClaimId, setRejectionModalClaimId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  useEffect(() => {
    async function loadData(showLoader = true) {
      if (showLoader) setLoading(true);
      purgeLegacyClaims();
      const res = await fetchReimbursementsAction();
      const merged = mergeClaimsWithStorage(res || []);
      setClaims(merged);
      saveClaimsToStorage(merged);

      // Extract existing categories
      const setCats = new Set(DEFAULT_CATEGORIES);
      merged.forEach((c) => {
        if (c.category) setCats.add(c.category);
      });
      setCategoriesList(Array.from(setCats));

      if (showLoader) setLoading(false);
    }
    loadData(true);

    const onRefresh = () => {
      loadData(false);
    };
    window.addEventListener('ambizcon_workspace_refresh', onRefresh);
    return () => window.removeEventListener('ambizcon_workspace_refresh', onRefresh);
  }, []);

  // Listen for notification clicks to open specific claim notes
  useEffect(() => {
    const handleOpenFromNotif = (e: any) => {
      const { claimId, claimNo } = e.detail || {};
      if (!claimId && !claimNo) return;
      const found = claims.find((c) => c._id === claimId || c.claimNo === claimNo);
      if (found) {
        handleOpenClaimDetails(found);
      }
    };
    window.addEventListener('ambizcon_open_claim_note', handleOpenFromNotif);
    return () => window.removeEventListener('ambizcon_open_claim_note', handleOpenFromNotif);
  }, [claims]);

  if (!currentUser) return null;

  // Add Custom Category dynamically
  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) {
      toast.error('Please enter a category name');
      return;
    }
    if (categoriesList.includes(trimmed)) {
      toast.error('Category already exists');
      return;
    }
    setCategoriesList([...categoriesList, trimmed]);
    setNewCategoryInput('');
    setIsAddingNewCategory(false);
    toast.success(`Category "${trimmed}" added!`);
  };

  // Multi-item handlers
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        category: categoriesList[0] || 'Travel',
        customCategoryName: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        receiptName: '',
        receiptUrl: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      toast.error('At least one expense line item is required');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleFileUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security Check: Prohibited extensions (.exe, .bat, .sh, .cmd, .js, .vbs, .msi, etc.)
    const lowerName = file.name.toLowerCase();
    const PROHIBITED = ['.exe', '.bat', '.sh', '.cmd', '.js', '.vbs', '.scr', '.msi', '.ps1', '.jar'];
    if (PROHIBITED.some((ext) => lowerName.endsWith(ext))) {
      toast.error(`Security Violation: "${file.name}" is a prohibited file type.`, {
        description: 'Executable and script files cannot be uploaded. Please attach PDF or images.',
      });
      return;
    }

    // File size check: warn if file exceeds 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File "${file.name}" is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, {
        description: 'Maximum attachment size is 5 MB. Please select a smaller receipt or document.',
      });
      return;
    }

    // Client-side image compression for receipts (reduces large phone photos from 5MB+ to ~200KB)
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1600;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedUrl = canvas.toDataURL('image/jpeg', 0.8);
              const updated = [...items];
              updated[index].receiptName = file.name;
              updated[index].receiptUrl = compressedUrl;
              setItems(updated);
              toast.success(`Attached & optimized: ${file.name}`);
              return;
            }
          } catch {
            // fallback if canvas context fails
          }
          const updated = [...items];
          updated[index].receiptName = file.name;
          updated[index].receiptUrl = reader.result as string;
          setItems(updated);
          toast.success(`Attached file: ${file.name}`);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
      return;
    }

    // Non-image documents (PDFs, docs, spreadsheets)
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const updated = [...items];
      updated[index].receiptName = file.name;
      updated[index].receiptUrl = result;
      setItems(updated);
      toast.success(`Attached document: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const totalCalculatedAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // Submit / Draft Claim with > ₹200 Document Validation
  const handleSubmitOrDraft = async (e: React.FormEvent, isDraft: boolean) => {
    e.preventDefault();

    if (totalCalculatedAmount <= 0) {
      toast.error('Please enter valid expense amounts');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const amt = Number(it.amount) || 0;

      if (!it.description.trim()) {
        toast.error(`Please provide a description for Line Item #${i + 1}`);
        return;
      }

      // Mandatory receipt validation rule: above ₹200 requires document receipt
      if (amt > 200 && !it.receiptName.trim()) {
        toast.error(
          `Line Item #${i + 1} amount (₹${amt}) is above ₹200. Document/receipt attachment is required.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const firstCategory =
        items[0].category === '__OTHER__' && items[0].customCategoryName
          ? items[0].customCategoryName.trim()
          : items[0].category;

      const primaryDesc =
        items.length > 1
          ? `${items[0].description} (+${items.length - 1} more items)`
          : items[0].description;
      const primaryReceipt = items[0].receiptName.trim() || '';

      const formattedItems: ExpenseItem[] = items.map((it, idx) => {
        const catName =
          it.category === '__OTHER__' && it.customCategoryName
            ? it.customCategoryName.trim()
            : it.category;

        return {
          id: `exp_${idx}_${Date.now()}`,
          category: catName,
          amount: Number(it.amount) || 0,
          date: it.date,
          description: it.description,
          receiptName: it.receiptName.trim() || '',
          receiptUrl: it.receiptUrl || '',
        };
      });

      if (editingClaim) {
        // Edit Mode: update existing claim before approval
        const editPayload = {
          claimId: editingClaim._id,
          userId: currentUser?._id,
          userEmail: currentUser?.email,
          userName: currentUser?.name,
          userRole: currentUser?.role,
          category: firstCategory,
          amount: totalCalculatedAmount,
          date: items[0].date,
          description: primaryDesc,
          receiptName: primaryReceipt,
          receiptUrl: items[0].receiptUrl || '',
          items: formattedItems,
        };

        let updated: ReimbursementClaim | null = null;
        try {
          const res = await fetch('/api/reimbursements/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editPayload),
          });
          if (res.ok) {
            const resJson = await res.json();
            if (resJson && resJson.claim) {
              updated = resJson.claim;
            }
          }
        } catch (apiErr) {
          console.warn('API update failed, attempting Server Action fallback:', apiErr);
        }

        if (!updated) {
          updated = await updateReimbursementAction(editingClaim._id, editPayload, {
            id: currentUser?._id,
            email: currentUser?.email,
            role: currentUser?.role,
            name: currentUser?.name,
          });
        }

        if (!updated) {
          throw new Error('Unable to update claim record');
        }

        const nextClaims = claims.map((c) => (c._id === editingClaim._id ? { ...c, ...updated } : c));
        setClaims(nextClaims);
        saveClaimsToStorage(nextClaims);

        if (selectedClaimDetail?._id === editingClaim._id) {
          setSelectedClaimDetail({ ...selectedClaimDetail, ...updated });
        }

        toast.success(`Claim ${editingClaim.claimNo} updated successfully!`);
        setIsSubmitModalOpen(false);
        setEditingClaim(null);
        return;
      }

      const submissionPayload = {
        userId: currentUser._id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        userAvatar: currentUser.avatar,
        company: currentUser.company || (isAustralia ? 'Ambizcon' : 'Ambizcon Health'),
        category: firstCategory,
        amount: totalCalculatedAmount,
        date: items[0].date,
        description: primaryDesc,
        receiptName: primaryReceipt,
        items: formattedItems,
        isDraft,
      };

      let created: ReimbursementClaim | null = null;

      // 1. Try submission via /api/reimbursements/submit (robust against Server Action RPC size limits)
      try {
        const res = await fetch('/api/reimbursements/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionPayload),
        });
        if (res.ok) {
          const resJson = await res.json();
          if (resJson && resJson.claim) {
            created = resJson.claim;
          }
        }
      } catch (apiErr) {
        console.warn('API submission failed, attempting Server Action fallback:', apiErr);
      }

      // 2. Fallback to Server Action if API route didn't return a claim
      if (!created) {
        created = await submitReimbursementAction(submissionPayload);
      }

      if (!created) {
        throw new Error('Unable to create claim record');
      }

      const nextClaims = [created, ...claims];
      setClaims(nextClaims);
      saveClaimsToStorage(nextClaims);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ambizcon_reimbursements_updated'));
        window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
      }
      toast.success(
        isDraft
          ? `Claim ${created.claimNo} saved as DRAFT!`
          : `Claim ${created.claimNo} submitted successfully for Admin approval!`
      );
      setIsSubmitModalOpen(false);

      // Reset form
      setItems([
        {
          category: categoriesList[0] || 'Client Lunch',
          customCategoryName: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          description: '',
          receiptName: '',
          receiptUrl: '',
        },
      ]);
    } catch (err: any) {
      console.error('Submit reimbursement error:', err);
      toast.error(err?.message || 'Failed to submit claim', {
        description: 'Please ensure attachments are under 4.5 MB and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Action Handlers (Admin Approval Only)
  const handleApproveAdmin = async (id: string) => {
    // Reset zoom and reduce receipt size to normal as requested
    setImageZoom(1);
    setImageRotation(0);
    setExpandedReceiptIdx(null);

    const serverUpdated = await approveClaimAdminAction(id);
    const nextClaims = claims.map((c) => {
      if (c._id !== id) return c;
      const updatedClaim: ReimbursementClaim = serverUpdated
        ? { ...c, ...serverUpdated, comments: c.comments || serverUpdated.comments || [] }
        : { ...c, adminStatus: 'approved', ceoStatus: 'approved', status: 'Approved' };
      if (selectedClaimDetail?._id === id) setSelectedClaimDetail(updatedClaim);
      return updatedClaim;
    });
    setClaims(nextClaims);
    saveClaimsToStorage(nextClaims);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ambizcon_reimbursements_updated'));
      window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
    }
    toast.success(`Claim approved by Admin! Receipt reduced to normal.`);
  };

  const handleMarkPaid = async (id: string) => {
    const serverUpdated = await markClaimPaidAction(id);
    const nextClaims = claims.map((c) => {
      if (c._id !== id) return c;
      const updatedClaim: ReimbursementClaim = serverUpdated
        ? { ...c, ...serverUpdated, comments: c.comments || serverUpdated.comments || [] }
        : { ...c, isPaid: true, status: 'Paid' };
      if (selectedClaimDetail?._id === id) setSelectedClaimDetail(updatedClaim);
      return updatedClaim;
    });
    setClaims(nextClaims);
    saveClaimsToStorage(nextClaims);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ambizcon_reimbursements_updated'));
      window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
    }
    toast.success(`Claim marked as PAID OUT! Payout record archived.`);
  };

  const handleOpenRejectModal = (id: string) => {
    setRejectionModalClaimId(id);
    setRejectionReasonInput('');
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModalClaimId) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Please enter a rejection reason for compliance auditing');
      return;
    }

    // Reset zoom and reduce receipt size to normal as requested
    setImageZoom(1);
    setImageRotation(0);
    setExpandedReceiptIdx(null);

    const serverUpdated = await rejectClaimAction(rejectionModalClaimId, 'admin', rejectionReasonInput.trim());
    const nextClaims = claims.map((c) => {
      if (c._id !== rejectionModalClaimId) return c;
      const rejComment: ClaimComment = {
        id: `cmt_${Date.now()}`,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        text: `Claim Rejected. Reason: ${rejectionReasonInput.trim()}`,
        createdAt: new Date().toISOString(),
      };
      const updatedClaim: ReimbursementClaim = serverUpdated
        ? { ...c, ...serverUpdated }
        : {
            ...c,
            adminStatus: 'rejected',
            tlStatus: 'rejected',
            ceoStatus: 'rejected',
            status: 'Rejected',
            rejectionReason: rejectionReasonInput.trim(),
            comments: [...(c.comments || []), rejComment],
          };
      if (selectedClaimDetail?._id === rejectionModalClaimId) setSelectedClaimDetail(updatedClaim);
      return updatedClaim;
    });
    setClaims(nextClaims);
    saveClaimsToStorage(nextClaims);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ambizcon_reimbursements_updated'));
      window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
    }
    toast.error(`Claim rejected by Admin with documented reason. Receipt reduced to normal.`);
    setRejectionModalClaimId(null);
  };

  const handleSubmitDraft = async (id: string) => {
    const serverUpdated = await submitDraftClaimAction(id);
    const nextClaims = claims.map((c) =>
      c._id === id ? (serverUpdated || { ...c, status: 'Pending Approval' as ClaimStatus }) : c
    );
    setClaims(nextClaims);
    saveClaimsToStorage(nextClaims);
    toast.success('Draft claim submitted for Admin review!');
  };

  const handleCancelClaim = async (id: string) => {
    const serverUpdated = await cancelClaimAction(id);
    const nextClaims = claims.map((c) =>
      c._id === id ? (serverUpdated || { ...c, status: 'Cancelled' as ClaimStatus }) : c
    );
    setClaims(nextClaims);
    saveClaimsToStorage(nextClaims);
    toast.info('Claim cancelled.');
  };

  // Shared helper to add a note on any claim and dispatch role-targeted notifications:
  // - If note added by Member or TL -> Notify Admin in Notifications
  // - If note added by Admin -> Notify Member & TL in Notifications
  const addNoteAndNotify = async (targetClaim: ReimbursementClaim, rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    setIsAddingComment(true);
    try {
      await addClaimCommentAction(
        targetClaim._id,
        currentUser.name,
        currentUser.role,
        trimmed
      );
    } catch {
      // fallback to client state
    }

    const newNote: ClaimComment = {
      id: `cmt_${Date.now()}`,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const existingComments = targetClaim.comments || [];
    const updatedComments = [...existingComments, newNote];
    const noteNumber = updatedComments.length;
    const noteLabel = `${noteNumber} ${noteNumber === 1 ? 'Note' : 'Notes'}`;

    const updatedClaim: ReimbursementClaim = {
      ...targetClaim,
      comments: updatedComments,
    };

    const nextClaims = claims.map((c) => (c._id === targetClaim._id ? updatedClaim : c));
    setClaims(nextClaims);
    saveClaimsToStorage(nextClaims);

    if (selectedClaimDetail?._id === targetClaim._id) {
      setSelectedClaimDetail(updatedClaim);
    }

    // Role-based Notification Dispatch
    const addedByAdmin =
      currentUser.role === 'Super Admin' || currentUser.role === 'Admin';

    if (addedByAdmin) {
      // Admin added note -> Notify Member and Team Lead in Notifications
      useNotificationStore.getState().addNotification({
        type: 'reimbursement_note',
        category: 'Reimbursement Note (Member & TL)',
        title: `📝 ${noteNumber} Note Added by Admin • ${targetClaim.claimNo}`,
        text: `Admin ${currentUser.name} added ${noteNumber} Note on ${targetClaim.userName}'s Claim ${targetClaim.claimNo}: "${trimmed}" (Member & TL Notified)`,
        color: 'bg-emerald-500',
        link: '/reimbursements',
        claimId: targetClaim._id,
        claimNo: targetClaim.claimNo,
        targetRoles: ['Team Member', 'Team Lead'],
        senderName: currentUser.name,
        senderRole: currentUser.role,
      });

      toast.success(`${noteNumber} Note Added on ${targetClaim.claimNo}!`, {
        description: `Member (${targetClaim.userName}) & Team Lead (${targetClaim.userTeam} TL) have been notified in System Notifications.`,
      });
    } else {
      // Member or Team Lead added note -> Notify Admin in Notifications
      useNotificationStore.getState().addNotification({
        type: 'reimbursement_note',
        category: 'Reimbursement Note (Admin)',
        title: `📝 ${noteNumber} Note Added by ${currentUser.role} • ${targetClaim.claimNo}`,
        text: `${currentUser.name} (${currentUser.role}) added ${noteNumber} Note on Claim ${targetClaim.claimNo}: "${trimmed}" (Admin Notified)`,
        color: 'bg-amber-500',
        link: '/reimbursements',
        claimId: targetClaim._id,
        claimNo: targetClaim.claimNo,
        targetRoles: ['Super Admin', 'Admin'],
        senderName: currentUser.name,
        senderRole: currentUser.role,
      });

      toast.success(`${noteNumber} Note Added on ${targetClaim.claimNo}!`, {
        description: `Admin has been notified in System Notifications (${noteLabel} total).`,
      });
    }

    setIsAddingComment(false);
  };

  const handlePostComment = async () => {
    if (!selectedClaimDetail || !newCommentText.trim()) return;
    const text = newCommentText;
    setNewCommentText('');
    await addNoteAndNotify(selectedClaimDetail, text);
  };

  // Branch-scoped claims (Ambizcon AU vs Ambizcon Health - India)
  const activeCompanyScope = isAustralia ? 'Ambizcon' : 'Ambizcon Health - India';
  const branchScopedClaims = claims.filter((c) =>
    isUserInCompany({ userId: c.userId, userName: c.userName, company: c.company }, activeCompanyScope)
  );

  // VISIBILITY FILTERING:
  // - Admin sees ALL claims in selected branch
  // - Team Lead sees their team's claims + self claims (so TL can view/add notes & receive Admin note alerts)
  // - Regular Member sees self claims (or claims matching their name)
  const visibleClaims = branchScopedClaims.filter((c) => {
    if (isSuperAdmin) return true;
    if (isTeamLead) {
      return c.userTeam === currentUser.team || c.userId === currentUser._id || c.userName === currentUser.name;
    }
    return c.userId === currentUser._id || c.userName === currentUser.name;
  });

  // Time-Range & Category Scoped Organization Claims (Updates KPI cards dynamically when Time Range changes!)
  const timeScopedBranchClaims = branchScopedClaims.filter((c) => {
    if (!doesClaimMatchDateRange(c, dateRangeOption, customStartDate, customEndDate)) return false;
    if (selectedCategoryFilter !== 'All' && c.category !== selectedCategoryFilter) return false;
    return true;
  });

  const activeValidTimeClaims = timeScopedBranchClaims.filter(
    (c) => c.status !== 'Cancelled' && c.status !== 'Draft'
  );
  const approvedTimeClaims = activeValidTimeClaims.filter(
    (c) => c.status === 'Approved' || c.adminStatus === 'approved' || c.isPaid || c.status === 'Paid'
  );
  const paidTimeClaims = activeValidTimeClaims.filter((c) => c.isPaid || c.status === 'Paid');
  const pendingTimeClaims = activeValidTimeClaims.filter(
    (c) =>
      c.status === 'Pending Approval' ||
      (c.status as string) === 'Pending TL' ||
      (c.status as string) === 'Pending CEO'
  );
  const approvedUnpaidTimeClaims = activeValidTimeClaims.filter(
    (c) => (c.status === 'Approved' || c.adminStatus === 'approved') && !c.isPaid && c.status !== 'Paid'
  );
  const myTimeClaims = activeValidTimeClaims.filter(
    (c) => c.userId === currentUser._id || c.userName === currentUser.name
  );

  // Dynamic KPI Totals for Selected Time Range (All Time / Daily / Weekly / Monthly / Custom)
  const totalOrgClaimedAmount = activeValidTimeClaims.reduce((acc, c) => acc + c.amount, 0);
  const totalOrgClaimsCount = activeValidTimeClaims.length;
  const totalOrgApprovedAmount = approvedTimeClaims.reduce((acc, c) => acc + c.amount, 0);
  const totalOrgApprovedCount = approvedTimeClaims.length;
  const totalOrgPaidAmount = paidTimeClaims.reduce((acc, c) => acc + c.amount, 0);
  const totalOrgPaidCount = paidTimeClaims.length;
  const totalOrgPendingAmount = pendingTimeClaims.reduce((acc, c) => acc + c.amount, 0);
  const totalOrgPendingCount = pendingTimeClaims.length;
  const totalOrgApprovedUnpaidAmount = approvedUnpaidTimeClaims.reduce((acc, c) => acc + c.amount, 0);
  const totalOrgApprovedUnpaidCount = approvedUnpaidTimeClaims.length;
  const myActiveClaimsCount = myTimeClaims.length;
  const myActiveClaimsAmount = myTimeClaims.reduce((acc, c) => acc + c.amount, 0);
  const mySettledAmount = myTimeClaims
    .filter((c) => c.isPaid || c.status === 'Paid' || c.status === 'Approved' || c.adminStatus === 'approved')
    .reduce((acc, c) => acc + c.amount, 0);

  const TIME_RANGE_DISPLAY_LABELS: Record<'All Time' | 'Today' | 'This Week' | 'This Month' | 'Custom', string> = {
    'All Time': 'All Time',
    Today: 'Daily (Today)',
    'This Week': 'Weekly (This Week)',
    'This Month': 'Monthly (This Month)',
    Custom: 'Custom Range',
  };

  const activeTimeRangeBadgeText =
    dateRangeOption === 'Custom' && customStartDate && customEndDate
      ? `Custom: ${customStartDate} → ${customEndDate}`
      : TIME_RANGE_DISPLAY_LABELS[dateRangeOption];

  // Apply Search, Status, Category & Date Range Filters for Ledger List
  const filteredClaims = visibleClaims
    .filter((c) => {
      if (!doesClaimMatchDateRange(c, dateRangeOption, customStartDate, customEndDate)) {
        return false;
      }

      // Status Filter
      if (selectedStatusFilter !== 'All') {
        if (selectedStatusFilter === 'Approved') {
          const isApproved =
            c.status === 'Approved' || c.adminStatus === 'approved' || c.status === 'Paid' || c.isPaid;
          if (!isApproved) return false;
        } else if (selectedStatusFilter === 'Paid') {
          if (!c.isPaid && c.status !== 'Paid') return false;
        } else if (c.status !== selectedStatusFilter) {
          return false;
        }
      }

      // Category Filter
      if (selectedCategoryFilter !== 'All' && c.category !== selectedCategoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNo = c.claimNo.toLowerCase().includes(q);
        const matchUser = c.userName.toLowerCase().includes(q);
        const matchDesc = c.description.toLowerCase().includes(q);
        const matchAmt = c.amount.toString().includes(q);
        if (!matchNo && !matchUser && !matchDesc && !matchAmt) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'amount_high') return b.amount - a.amount;
      if (sortBy === 'amount_low') return a.amount - b.amount;
      return 0;
    });

  // Helper to generate and download CSV for any given claim list and label
  const downloadClaimsCSV = (
    claimsToExport: ReimbursementClaim[],
    rangeLabel: string,
    includeSummary = true
  ) => {
    const headers =
      'Claim No,Employee,Team,Company,Category,Total Amount (INR),Expense Count,Notes Count,Expense Date,Status,Paid & Settled,Rejection Reason';
    const rows = claimsToExport.map((c) => {
      const itemCount = c.items?.length || 1;
      const notesCount = c.comments?.length || 0;
      const reason = c.rejectionReason ? `"${c.rejectionReason.replace(/"/g, '""')}"` : 'N/A';
      return `${c.claimNo},"${c.userName}",${c.userTeam},"${c.company || 'Ambizcon'}","${c.category}",${c.amount},${itemCount},${notesCount},${c.date},${c.status},${c.isPaid || c.status === 'Paid' ? 'Paid & Settled' : 'Unpaid'},${reason}`;
    });

    const summaryRows: string[] = [];
    if (includeSummary) {
      const validList = claimsToExport.filter((c) => c.status !== 'Cancelled' && c.status !== 'Draft');
      const sumTotal = validList.reduce((acc, c) => acc + c.amount, 0);
      const sumPaid = validList.filter((c) => c.isPaid || c.status === 'Paid').reduce((acc, c) => acc + c.amount, 0);
      const sumPending = validList
        .filter((c) => c.status === 'Pending Approval' || (c.status === 'Approved' && !c.isPaid))
        .reduce((acc, c) => acc + c.amount, 0);

      summaryRows.push('');
      summaryRows.push(`"SUMMARY TOTALS (${rangeLabel})","","","","",${sumTotal},"","","","Total Claimed","Paid: INR ${sumPaid}","Pending: INR ${sumPending}"`);
      summaryRows.push(`"PAID & SETTLED TOTAL","","","","",${sumPaid},"","","","Paid & Settled","${validList.filter((c) => c.isPaid || c.status === 'Paid').length} Vouchers",""`);
      summaryRows.push(`"PENDING SIGNOFF TOTAL","","","","",${sumPending},"","","","Pending Signoff","${validList.filter((c) => c.status === 'Pending Approval' || (c.status === 'Approved' && !c.isPaid)).length} Claims",""`);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers].concat(rows, summaryRows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AmbizClaim_Reimbursement_Report_${rangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Quick CSV Export for currently active page filter & date range
  const handleExportCSV = () => {
    let rangeLabel = dateRangeOption.replace(/\s+/g, '_');
    if (dateRangeOption === 'Custom' && customStartDate && customEndDate) {
      rangeLabel = `Custom_${customStartDate}_to_${customEndDate}`;
    }
    downloadClaimsCSV(filteredClaims, rangeLabel, true);
    toast.success(`Reimbursement Report (${activeTimeRangeBadgeText}) downloaded!`);
  };

  // Custom Modal CSV Export
  const customModalPreviewClaims = visibleClaims.filter((c) => {
    if (!doesClaimMatchDateRange(c, exportRangeOption, exportStartDate, exportEndDate)) return false;
    if (exportCategoryFilter !== 'All' && c.category !== exportCategoryFilter) return false;
    if (exportStatusFilter === 'Paid & Settled') return c.isPaid || c.status === 'Paid';
    if (exportStatusFilter === 'Pending Signoff')
      return c.status === 'Pending Approval' || (c.status === 'Approved' && !c.isPaid);
    if (exportStatusFilter === 'Approved') return c.status === 'Approved';
    if (exportStatusFilter === 'Rejected') return c.status === 'Rejected';
    return true;
  });

  const handleOpenCustomExportModal = () => {
    setExportRangeOption(dateRangeOption);
    setExportStartDate(customStartDate || getLocalYMD(30));
    setExportEndDate(customEndDate || getLocalYMD(0));
    setExportCategoryFilter(selectedCategoryFilter);
    setIsExportModalOpen(true);
  };

  const handleExecuteCustomExport = () => {
    let rangeLabel = exportRangeOption.replace(/\s+/g, '_');
    if (exportRangeOption === 'Custom' && exportStartDate && exportEndDate) {
      rangeLabel = `Custom_${exportStartDate}_to_${exportEndDate}`;
    }
    if (exportStatusFilter !== 'All') {
      rangeLabel += `_${exportStatusFilter.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    downloadClaimsCSV(customModalPreviewClaims, rangeLabel, exportIncludeSummary);
    toast.success(`Custom Reimbursement Report (${customModalPreviewClaims.length} records) downloaded!`);
    setIsExportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border ambizcon-hero-banner p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div
            className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-glow border overflow-hidden ${
              isAustralia ? 'bg-white p-2 border-amber-500/40' : 'border-emerald-500/30'
            }`}
          >
            <img
              src={isAustralia ? '/ambizcon-australia-icon.png' : '/ambizcon-logo.png'}
              alt="Logo"
              className={`h-full w-full ${isAustralia ? 'object-contain' : 'object-cover'}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                AmbizClaim — Expense & Reimbursements
              </h1>
              <Badge className={`font-bold ${
                isAustralia
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                {isSuperAdmin ? 'Admin Approval Portal' : 'My Claims Portal'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-Item Expenses • Mandatory Receipt (&gt; ₹200) • Daily/Weekly/Monthly Date Range &amp; Custom Exports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleOpenCreateModal} className="gap-2 ambizcon-gradient text-white shadow-glow">
            <Plus className="h-4 w-4" />
            Submit Expense Claim
          </Button>

          <Button onClick={handleExportCSV} variant="outline" className="gap-1.5 text-xs">
            <Download className="h-4 w-4" />
            Export CSV ({TIME_RANGE_DISPLAY_LABELS[dateRangeOption]})
          </Button>

          <Button
            onClick={handleOpenCustomExportModal}
            variant="outline"
            className="gap-1.5 text-xs border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-300 hover:bg-brand-500/20"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Download Option (Custom)
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards (DYNAMICALLY RECALCULATED BY SELECTED TIME RANGE: ALL TIME / DAILY / WEEKLY / MONTHLY / CUSTOM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              Total Organization Claims
            </span>
            <span className="rounded-full bg-brand-500/10 border border-brand-500/30 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
              {activeTimeRangeBadgeText}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            ₹{totalOrgClaimedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {totalOrgClaimsCount} Total Submissions in {TIME_RANGE_DISPLAY_LABELS[dateRangeOption]}
          </span>
        </Card>

        <Card className="p-4 border border-emerald-500/30 bg-emerald-500/[0.02] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Approved &amp; Settled
            </span>
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-300">
              {activeTimeRangeBadgeText}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">
            ₹{totalOrgApprovedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {totalOrgApprovedCount} Approved by Admin • ₹{totalOrgPaidAmount.toLocaleString('en-IN')} ({totalOrgPaidCount}) Paid Out
          </span>
        </Card>

        <Card className="p-4 border border-amber-500/30 bg-amber-500/[0.02] relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
              Pending Admin Signoff
            </span>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-600 dark:text-amber-300">
              {activeTimeRangeBadgeText}
            </span>
          </div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">
            ₹{totalOrgPendingAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {totalOrgPendingCount} Claims Awaiting Admin Approval
            {totalOrgApprovedUnpaidCount > 0 ? ` • ${totalOrgApprovedUnpaidCount} Approved (₹${totalOrgApprovedUnpaidAmount.toLocaleString('en-IN')})` : ''}
          </span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 relative overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
              My Active Claims
            </span>
            <span className="rounded-full bg-brand-500/10 border border-brand-500/30 px-2 py-0.5 text-[9px] font-bold text-brand-600 dark:text-brand-300">
              {activeTimeRangeBadgeText}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-extrabold text-brand-500">{myActiveClaimsCount}</span>
            <span className="text-sm font-bold text-foreground">
              (₹{myActiveClaimsAmount.toLocaleString('en-IN')})
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            Submitted by You • ₹{mySettledAmount.toLocaleString('en-IN')} Approved/Settled
          </span>
        </Card>
      </div>

      {/* Filter & Management Toolbar */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        {/* Main Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search claims by Claim #, Employee, Rationale, or Amount..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background focus-ring"
            />
          </div>

          {/* Dropdown Filters & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Time Range Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-brand-500" />
                Time Range:
              </span>
              <select
                value={dateRangeOption}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setDateRangeOption(val);
                  if (val === 'Custom') {
                    if (!customStartDate) setCustomStartDate(getLocalYMD(30));
                    if (!customEndDate) setCustomEndDate(getLocalYMD(0));
                  }
                }}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
              >
                <option value="All Time">All Time</option>
                <option value="Today">Daily (Today)</option>
                <option value="This Week">Weekly (This Week)</option>
                <option value="This Month">Monthly (This Month)</option>
                <option value="Custom">Custom Range</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 shrink-0">
                <Layers className="h-3.5 w-3.5 text-emerald-500" />
                Category:
              </span>
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
              >
                <option value="All">All Categories</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid Out</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>

            {/* Download Custom CSV */}
            <Button
              onClick={handleOpenCustomExportModal}
              size="sm"
              variant="outline"
              className="text-xs gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20"
              title="Download claims spreadsheet"
            >
              <Download className="h-3.5 w-3.5" />
              Download CSV
            </Button>

            {/* Add Custom Category */}
            {!isAddingNewCategory ? (
              <Button
                onClick={() => setIsAddingNewCategory(true)}
                variant="outline"
                size="sm"
                className="text-xs gap-1"
                title="Create a new expense category"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Category
              </Button>
            ) : (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="New Category..."
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring"
                />
                <Button onClick={handleAddNewCategory} size="sm" className="bg-emerald-600 text-white text-xs">
                  Save
                </Button>
                <Button onClick={() => setIsAddingNewCategory(false)} size="sm" variant="ghost" className="text-xs">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Custom Range Date Pickers */}
        {dateRangeOption === 'Custom' && (
          <div className="flex items-center gap-2 text-xs bg-zinc-100/70 dark:bg-zinc-900/70 px-3 py-1.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 w-fit pt-2">
            <span className="text-muted-foreground text-[11px] font-semibold">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-2 py-0.5 text-xs focus-ring"
            />
            <span className="text-muted-foreground text-[11px] font-semibold">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background px-2 py-0.5 text-xs focus-ring"
            />
          </div>
        )}
      </Card>

      {/* Claims Table & Management */}
      <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Reimbursement Claims Ledger</h3>
            <p className="text-xs text-muted-foreground">
              {isSuperAdmin
                ? 'Review employee claims, verify receipt attachments, approve payouts, and document audit decisions.'
                : 'Inspect your submitted reimbursement claims, draft items, and payment status.'}
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            Showing {filteredClaims.length} Claims ({dateRangeOption})
          </Badge>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 mx-auto mb-2 text-zinc-400 opacity-60" />
            <p className="text-sm font-semibold">No claims found</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isSuperAdmin
                ? 'No employee claims match the selected date range or category filters.'
                : 'You have not submitted any claims matching these date range filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClaims.map((claim) => {
              const isPendingAdmin =
                claim.status === 'Pending Approval' ||
                (claim.status as string) === 'Pending TL' ||
                (claim.status as string) === 'Pending CEO';
              const isReadyPaid = claim.status === 'Approved' && !claim.isPaid;
              const isDraft = claim.status === 'Draft';
              const notesList = claim.comments || [];
              const noteCount = notesList.length;
              const isInlineNoteOpen = inlineNoteClaimId === claim._id;

              return (
                <div
                  key={claim._id}
                  className="flex flex-col gap-3 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Employee & Claim Detail */}
                    <div className="flex items-start gap-3.5 min-w-[280px] flex-1">
                      <Avatar src={claim.userAvatar} name={claim.userName} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{claim.userName}</span>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {claim.claimNo}
                          </Badge>
                          <span className="text-[10px] font-mono text-muted-foreground">[{claim.userTeam}]</span>

                          {/* Note Count Badge right on the claim header if notes added */}
                          {noteCount > 0 && (
                            <span
                              onClick={() => handleOpenClaimDetails(claim)}
                              className="cursor-pointer inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300 shadow-sm"
                              title="Click to inspect notes"
                            >
                              <MessageSquare className="h-3 w-3" />
                              {noteCount === 1 ? '1 Note Added' : `${noteCount} Notes Added`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ₹{claim.amount.toLocaleString('en-IN')} • {claim.category}
                          {claim.items && claim.items.length > 1 && (
                            <span className="ml-1 text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
                              ({claim.items.length} Items)
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-zinc-500 mt-0.5 italic max-w-md truncate">"{claim.description}"</p>

                        {/* Numbered Notes List (1 Note, 2 Note...) directly on the Ledger Card */}
                        {noteCount > 0 && (
                          <div className="mt-2.5 space-y-1.5">
                            {notesList.map((cmt, idx) => {
                              const byAdmin =
                                cmt.authorRole === 'Super Admin' || cmt.authorRole === 'Admin';
                              return (
                                <div
                                  key={cmt.id || idx}
                                  className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/10 px-3 py-1.5 text-xs"
                                >
                                  <span className="rounded-md bg-brand-500 text-white px-1.5 py-0.5 text-[10px] font-extrabold font-mono uppercase">
                                    {idx + 1} Note
                                  </span>
                                  <span className="font-semibold text-foreground">"{cmt.text}"</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    — by <strong>{cmt.authorName}</strong> ({cmt.authorRole})
                                  </span>
                                  <span
                                    className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                      byAdmin
                                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                    }`}
                                  >
                                    <Bell className="h-2.5 w-2.5" />
                                    {byAdmin ? 'Notified Member & TL' : 'Notified Admin'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Inspect & Quick Add Note Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isInlineNoteOpen) {
                            setInlineNoteClaimId(null);
                          } else {
                            setInlineNoteClaimId(claim._id);
                            setInlineNoteInput('');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 rounded-xl hover:bg-emerald-500/20 transition-all"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        {noteCount > 0
                          ? `${noteCount} ${noteCount === 1 ? 'Note' : 'Notes'} (+ Add)`
                          : '+ Add Note'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenClaimDetails(claim)}
                        className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 rounded-xl hover:bg-brand-500/20 transition-all"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect Claim & Receipts
                      </button>

                      {(() => {
                        const isApprovedOrPaid =
                          claim.status === 'Approved' ||
                          claim.adminStatus === 'approved' ||
                          claim.isPaid ||
                          claim.status === 'Paid';
                        const canEditClaim =
                          !isApprovedOrPaid && (isSuperAdmin || claim.userId === currentUser._id);
                        if (!canEditClaim) return null;
                        return (
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(claim)}
                            className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-bold border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 rounded-xl hover:bg-blue-500/20 transition-all"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            Edit Claim
                          </button>
                        );
                      })()}
                    </div>

                    {/* Workflow Status Badge (Single Admin Approval) */}
                    <div className="flex items-center gap-2 text-xs">
                      {isDraft ? (
                        <Badge className="bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 font-bold">
                          DRAFT SAVED
                        </Badge>
                      ) : claim.status === 'Approved' ||
                        claim.adminStatus === 'approved' ||
                        claim.isPaid ||
                        claim.status === 'Paid' ? (
                        <>
                          <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-extrabold">
                            ✓ APPROVED BY ADMIN
                          </Badge>
                          {(claim.isPaid || claim.status === 'Paid') && (
                            <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30 font-extrabold">
                              PAID OUT
                            </Badge>
                          )}
                        </>
                      ) : claim.status === 'Rejected' ? (
                        <Badge className="bg-rose-500/20 text-rose-600 border-rose-500/30 font-extrabold">
                          ✗ REJECTED
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-bold">
                          ... PENDING ADMIN APPROVAL
                        </Badge>
                      )}
                    </div>

                    {/* Action Controls (Admin Only Can Approve) */}
                    <div className="flex items-center gap-2">
                      {isDraft && claim.userId === currentUser._id && (
                        <div className="flex items-center gap-1">
                          <Button onClick={() => handleSubmitDraft(claim._id)} size="sm" className="bg-emerald-600 text-white text-xs py-1">
                            Submit Draft
                          </Button>
                          <Button onClick={() => handleCancelClaim(claim._id)} size="sm" variant="ghost" className="text-zinc-500 text-xs py-1">
                            Cancel
                          </Button>
                        </div>
                      )}

                      {isSuperAdmin && isPendingAdmin && (
                        <div className="flex items-center gap-1">
                          <Button onClick={() => handleApproveAdmin(claim._id)} size="sm" className="ambizcon-gradient text-white text-xs py-1 shadow-glow">
                            Approve Claim
                          </Button>
                          <Button onClick={() => handleOpenRejectModal(claim._id)} size="sm" variant="ghost" className="text-rose-500 text-xs py-1">
                            Reject
                          </Button>
                        </div>
                      )}

                      {isSuperAdmin && isReadyPaid && (
                        <Button onClick={() => handleMarkPaid(claim._id)} size="sm" className="bg-blue-600 text-white text-xs py-1 gap-1">
                          <CreditCard className="h-3.5 w-3.5" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Inline Quick Note Input Box on the Ledger Card */}
                  {isInlineNoteOpen && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/60">
                      <span className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 font-mono">
                        Add {noteCount + 1} Note:
                      </span>
                      <input
                        type="text"
                        value={inlineNoteInput}
                        onChange={(e) => setInlineNoteInput(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === 'Enter' && inlineNoteInput.trim()) {
                            e.preventDefault();
                            const text = inlineNoteInput;
                            setInlineNoteInput('');
                            await addNoteAndNotify(claim, text);
                          }
                        }}
                        placeholder={
                          isSuperAdmin
                            ? `Write ${noteCount + 1} Note (Will notify Member & TL in Notifications)...`
                            : `Write ${noteCount + 1} Note (Will notify Admin in Notifications)...`
                        }
                        className="flex-1 min-w-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={isAddingComment || !inlineNoteInput.trim()}
                        onClick={async () => {
                          const text = inlineNoteInput;
                          setInlineNoteInput('');
                          await addNoteAndNotify(claim, text);
                        }}
                        className="ambizcon-gradient text-white text-xs font-bold"
                      >
                        Save {noteCount + 1} Note &amp; Notify
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setInlineNoteClaimId(null)}
                        className="text-xs"
                      >
                        Close
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Multi-Item Create Claim Modal with > ₹200 Document Validation & Custom Categories */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => {
          setIsSubmitModalOpen(false);
          setEditingClaim(null);
        }}
        title={editingClaim ? `Edit Claim (${editingClaim.claimNo})` : "Submit Reimbursement Claim"}
        description={
          editingClaim
            ? "Update expense items, amounts, or receipts before approval."
            : "Add line items. For any expense item above ₹200, attaching a document/receipt is mandatory."
        }
        maxWidth="2xl"
      >
        <form className="space-y-4 pt-2">
          {items.map((item, idx) => {
            const isAmountOver200 = (Number(item.amount) || 0) > 200;

            return (
              <div key={idx} className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    Expense Line Item #{idx + 1}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Expense Category *</label>
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(idx, 'category', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__OTHER__">+ Add Own Custom Category</option>
                    </select>

                    {item.category === '__OTHER__' && (
                      <input
                        type="text"
                        value={item.customCategoryName || ''}
                        onChange={(e) => handleItemChange(idx, 'customCategoryName', e.target.value)}
                        placeholder="Type custom category..."
                        className="mt-1.5 w-full rounded-xl border border-brand-500/50 bg-background px-3 py-1 text-xs focus-ring"
                        required
                      />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-foreground">Amount (INR ₹) *</label>
                      {isAmountOver200 && (
                        <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                          &gt; ₹200 (Receipt Required)
                        </span>
                      )}
                    </div>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                      placeholder="e.g. 350"
                      className={`mt-1 w-full rounded-xl border ${
                        isAmountOver200 ? 'border-amber-500/60' : 'border-zinc-200 dark:border-zinc-800'
                      } bg-background px-3 py-1.5 text-xs focus-ring`}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Expense Date *</label>
                    <input
                      type="date"
                      value={item.date}
                      onChange={(e) => handleItemChange(idx, 'date', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                      <span>Document / Receipt Upload {isAmountOver200 ? '*' : '(Optional)'}</span>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">PDF, Images &amp; Docs (Max 5MB)</span>
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <label
                        htmlFor={`file_upload_${idx}`}
                        className={`flex-1 flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                          isAmountOver200 && !item.receiptName.trim()
                            ? 'border-rose-500 bg-rose-500/5'
                            : 'border-zinc-200 dark:border-zinc-800 bg-background'
                        } cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors`}
                      >
                        <Paperclip className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        <span className="text-xs text-foreground truncate flex-1 font-mono">
                          {item.receiptName ? item.receiptName : 'Click to Upload Receipt / Document...'}
                        </span>
                        <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                          Upload File
                        </span>
                      </label>
                      <input
                        id={`file_upload_${idx}`}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,application/pdf,image/*"
                        onChange={(e) => handleFileUpload(idx, e)}
                        className="hidden"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Supports PDF, PNG, JPG, WEBP, DOC, DOCX, XLS, XLSX (Max 5 MB)
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-foreground">Business Rationale *</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      placeholder="State rationale for expense..."
                      className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                      required
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <Button type="button" variant="outline" onClick={handleAddItem} size="sm" className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" />
              Add Another Line Item
            </Button>

            <div className="text-right">
              <span className="text-xs text-muted-foreground font-semibold block">Total Claim Amount</span>
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{totalCalculatedAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => { setIsSubmitModalOpen(false); setEditingClaim(null); }}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={(e) => handleSubmitOrDraft(e, true)}
              className="border-zinc-300 dark:border-zinc-700"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={(e) => handleSubmitOrDraft(e, false)}
              className="ambizcon-gradient text-white shadow-glow"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Claim Detail & Comments Modal with Inline Receipt Viewer */}
      {selectedClaimDetail && (
        <Modal
          isOpen={Boolean(selectedClaimDetail)}
          onClose={() => {
            setSelectedClaimDetail(null);
            setExpandedReceiptIdx(null);
            setImageZoom(1);
            setImageRotation(0);
          }}
          title={`Claim ${selectedClaimDetail.claimNo} Details & Audit Log`}
          description="Inspect itemized breakdown, receipt document inline with interactive zoom controls, and discussion thread."
          maxWidth="3xl"
        >
          <div className="space-y-4 pt-1">
            {/* Claimant & Amount Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Avatar src={selectedClaimDetail.userAvatar} name={selectedClaimDetail.userName} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground block">{selectedClaimDetail.userName}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {selectedClaimDetail.claimNo}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {selectedClaimDetail.userTeam} • {selectedClaimDetail.company || 'Ambizcon'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {(() => {
                  const isApprovedOrPaid =
                    selectedClaimDetail.status === 'Approved' ||
                    selectedClaimDetail.adminStatus === 'approved' ||
                    selectedClaimDetail.isPaid ||
                    selectedClaimDetail.status === 'Paid';
                  const canEditClaim =
                    !isApprovedOrPaid &&
                    (isSuperAdmin || selectedClaimDetail.userId === currentUser._id);
                  if (!canEditClaim) return null;
                  return (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const toEdit = selectedClaimDetail;
                        setSelectedClaimDetail(null);
                        handleOpenEditModal(toEdit);
                      }}
                      className="gap-1.5 text-xs border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                    >
                      <Edit className="h-3.5 w-3.5" />
                      Edit Claim
                    </Button>
                  );
                })()}

                <div className="flex items-center gap-2">
                  {selectedClaimDetail.status === 'Approved' ||
                  selectedClaimDetail.adminStatus === 'approved' ||
                  selectedClaimDetail.isPaid ||
                  selectedClaimDetail.status === 'Paid' ? (
                    <>
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-extrabold text-xs">
                        ✓ APPROVED BY ADMIN
                      </Badge>
                      {(selectedClaimDetail.isPaid || selectedClaimDetail.status === 'Paid') && (
                        <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30 font-extrabold text-xs">
                          PAID OUT
                        </Badge>
                      )}
                    </>
                  ) : selectedClaimDetail.status === 'Rejected' ? (
                    <Badge className="bg-rose-500/20 text-rose-600 border-rose-500/30 font-extrabold text-xs">
                      ✗ REJECTED
                    </Badge>
                  ) : selectedClaimDetail.status === 'Draft' ? (
                    <Badge className="bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 font-bold text-xs">
                      DRAFT
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-bold text-xs">
                      ... PENDING APPROVAL
                    </Badge>
                  )}
                </div>

                <div className="text-right border-l border-zinc-200 dark:border-zinc-800 pl-4">
                  <span className="text-[11px] text-muted-foreground font-semibold block">Total Claim Amount</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{selectedClaimDetail.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Admin Decision Banner (Reduce size to normal after approve or reject) */}
            {isSuperAdmin &&
              (selectedClaimDetail.status === 'Pending Approval' ||
                (selectedClaimDetail.status as string) === 'Pending TL' ||
                (selectedClaimDetail.status as string) === 'Pending CEO') && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs">
                    <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <span className="font-bold text-foreground block">Admin Approval Decision</span>
                      <span className="text-[11px] text-muted-foreground">
                        Inspect the expanded receipt below. Decision reduces preview size to normal.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 text-xs h-8"
                      onClick={() => {
                        // Immediately reduce size to normal
                        setImageZoom(1);
                        setImageRotation(0);
                        setExpandedReceiptIdx(null);
                        handleOpenRejectModal(selectedClaimDetail._id);
                      }}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1 text-rose-500" />
                      Reject Claim
                    </Button>

                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 shadow-sm font-semibold"
                      onClick={async () => {
                        // Immediately reduce size to normal
                        setImageZoom(1);
                        setImageRotation(0);
                        setExpandedReceiptIdx(null);
                        await handleApproveAdmin(selectedClaimDetail._id);
                      }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Approve Claim
                    </Button>
                  </div>
                </div>
              )}

            {/* Documented Rejection Reason if any */}
            {selectedClaimDetail.rejectionReason && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs">
                <span className="font-extrabold block">Rejection Reason Documented:</span>
                <p className="mt-0.5">{selectedClaimDetail.rejectionReason}</p>
              </div>
            )}

            {/* Itemized Expenses & Inline Expandable Receipt Viewer */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Itemized Expenses &amp; Receipt Attachments
                </h4>
                <span className="text-[11px] text-muted-foreground">
                  Receipts expand inline — no pop-up windows
                </span>
              </div>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {(selectedClaimDetail.items && selectedClaimDetail.items.length > 0
                  ? selectedClaimDetail.items
                  : [
                      {
                        id: 'exp_single',
                        category: selectedClaimDetail.category,
                        amount: selectedClaimDetail.amount,
                        date: selectedClaimDetail.date,
                        description: selectedClaimDetail.description,
                        receiptName: selectedClaimDetail.receiptName,
                        receiptUrl: selectedClaimDetail.receiptUrl,
                      },
                    ]
                ).map((it, idx) => {
                  const isExpanded = expandedReceiptIdx === idx;
                  const receiptSrc = getReceiptImageUrl(
                    it.receiptName,
                    it.receiptUrl || selectedClaimDetail.receiptUrl,
                    {
                      claimNo: selectedClaimDetail.claimNo,
                      category: it.category,
                      amount: it.amount,
                      date: it.date,
                      userName: selectedClaimDetail.userName,
                      description: it.description,
                    }
                  );

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border transition-all ${
                        isExpanded
                          ? 'border-brand-500/50 bg-brand-500/[0.02] shadow-sm'
                          : 'border-zinc-200 dark:border-zinc-800 bg-card hover:border-zinc-300 dark:hover:border-zinc-700'
                      } p-3.5`}
                    >
                      {/* Compact Item Header Row */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-foreground">{it.category}</span>
                            <Badge variant="outline" className="text-[10px] font-mono">
                              Item #{idx + 1}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground mt-0.5 block">{it.description}</span>
                          <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
                            Date: {it.date}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="font-extrabold text-sm text-foreground block">
                              ₹{it.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono block">
                              {receiptSrc ? `📄 ${it.receiptName || 'Receipt file'}` : 'No receipt attached'}
                            </span>
                          </div>

                          {receiptSrc ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (isExpanded) {
                                  setExpandedReceiptIdx(null);
                                  setImageZoom(1);
                                  setImageRotation(0);
                                } else {
                                  setExpandedReceiptIdx(idx);
                                  setImageZoom(1);
                                  setImageRotation(0);
                                }
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                isExpanded
                                  ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                                  : 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20 hover:bg-brand-500/20'
                              }`}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3.5 w-3.5" />
                                  <span>Collapse Receipt</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View Receipt</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-[11px] text-zinc-400 font-medium">
                              No Receipt Attached
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expanded Receipt Viewer: Inline, with Zoom In/Out, Reset, Rotate */}
                      {isExpanded && receiptSrc && (
                        <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 space-y-2.5 animate-in fade-in duration-200">
                          {/* Zoom & Inspection Toolbar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-100/90 dark:bg-zinc-900/90 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                              <Paperclip className="h-4 w-4 text-brand-500" />
                              <span className="text-xs font-bold text-foreground">
                                Receipt Document:
                              </span>
                              <span className="text-xs text-brand-600 dark:text-brand-400 font-mono truncate max-w-[160px]">
                                {it.receiptName || 'Receipt file'}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-background border border-zinc-200 dark:border-zinc-800 text-muted-foreground">
                                Zoom: {Math.round(imageZoom * 100)}%
                              </span>
                            </div>

                            {/* Zoom Controls */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                title="Zoom Out (-)"
                                onClick={() =>
                                  setImageZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))
                                }
                                disabled={imageZoom <= 0.5}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground disabled:opacity-40 transition-colors flex items-center gap-1 text-xs"
                              >
                                <ZoomOut className="h-3.5 w-3.5" />
                                <span className="text-[11px] hidden sm:inline">Zoom Out</span>
                              </button>

                              <button
                                type="button"
                                title="Reset Zoom to 100% (Normal Size)"
                                onClick={() => {
                                  setImageZoom(1);
                                  setImageRotation(0);
                                }}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors ${
                                  imageZoom === 1 && imageRotation === 0
                                    ? 'border-brand-500/40 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                                    : 'border-zinc-200 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground'
                                }`}
                              >
                                100% (Normal)
                              </button>

                              <button
                                type="button"
                                title="Zoom In (+)"
                                onClick={() =>
                                  setImageZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))
                                }
                                disabled={imageZoom >= 3}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground disabled:opacity-40 transition-colors flex items-center gap-1 text-xs"
                              >
                                <ZoomIn className="h-3.5 w-3.5" />
                                <span className="text-[11px] hidden sm:inline">Zoom In</span>
                              </button>

                              <button
                                type="button"
                                title="Rotate 90 degrees"
                                onClick={() => setImageRotation((r) => (r + 90) % 360)}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground transition-colors flex items-center gap-1 text-xs"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                                <span className="text-[11px] hidden sm:inline">Rotate</span>
                              </button>

                              <button
                                type="button"
                                title="Reduce to normal size / Collapse"
                                onClick={() => {
                                  setImageZoom(1);
                                  setImageRotation(0);
                                  setExpandedReceiptIdx(null);
                                }}
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-background hover:bg-rose-500/10 hover:border-rose-500/30 text-muted-foreground hover:text-rose-600 transition-colors ml-1"
                              >
                                <Minimize2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Inline Viewport */}
                          <div className="w-full min-h-[300px] max-h-[460px] overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950/5 dark:bg-black/40 p-4 flex items-center justify-center relative select-none">
                            <div
                              className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                              style={{
                                transform: `scale(${imageZoom}) rotate(${imageRotation}deg)`,
                              }}
                            >
                              <img
                                src={receiptSrc}
                                alt={`Receipt document for ${it.category}`}
                                className="max-h-[400px] w-auto max-w-full rounded-lg shadow-lg object-contain bg-white pointer-events-none"
                                loading="eager"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                            <span>
                              🔍 Use <b>Zoom In (+)</b> and <b>Zoom Out (-)</b> to verify item amounts &amp; GSTIN
                            </span>
                            <span className="text-[10px] font-mono">
                              Inline Viewer • No Pop-ups
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Audit Trail & Comments */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4 text-brand-500" />
                  Claim Notes &amp; Audit Trail (
                  {selectedClaimDetail.comments && selectedClaimDetail.comments.length > 0
                    ? `${selectedClaimDetail.comments.length} ${
                        selectedClaimDetail.comments.length === 1 ? 'Note Added' : 'Notes Added'
                      }`
                    : '0 Notes'}
                  )
                </h4>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  {isSuperAdmin
                    ? '🔔 Adding a note notifies Member & TL in Notifications'
                    : '🔔 Adding a note notifies Admin in Notifications'}
                </span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1 mb-3">
                {!selectedClaimDetail.comments || selectedClaimDetail.comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No notes added yet.</p>
                ) : (
                  selectedClaimDetail.comments.map((cmt, idx) => {
                    const byAdmin =
                      cmt.authorRole === 'Super Admin' || cmt.authorRole === 'Admin';
                    return (
                      <div
                        key={cmt.id || idx}
                        className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-brand-500 text-white px-1.5 py-0.5 text-[10px] font-extrabold font-mono uppercase">
                              {idx + 1} Note
                            </span>
                            <span className="font-bold text-foreground">
                              {cmt.authorName}{' '}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({cmt.authorRole})
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider ${
                                byAdmin
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              <Bell className="h-2.5 w-2.5" />
                              {byAdmin ? 'Notified Member & TL' : 'Notified Admin'}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {new Date(cmt.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <p className="text-foreground font-medium text-xs pl-1">"{cmt.text}"</p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newCommentText.trim()) {
                      e.preventDefault();
                      handlePostComment();
                    }
                  }}
                  placeholder={
                    isSuperAdmin
                      ? `Type ${(selectedClaimDetail.comments?.length || 0) + 1} Note (Notifies Member & TL)...`
                      : `Type ${(selectedClaimDetail.comments?.length || 0) + 1} Note (Notifies Admin)...`
                  }
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={isAddingComment || !newCommentText.trim()}
                  size="sm"
                  className="ambizcon-gradient text-white text-xs font-bold"
                >
                  Add {(selectedClaimDetail.comments?.length || 0) + 1} Note
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalClaimId && (
        <Modal
          isOpen={Boolean(rejectionModalClaimId)}
          onClose={() => setRejectionModalClaimId(null)}
          title="Document Rejection Reason"
          description="Provide a compliance reason for rejecting this reimbursement claim so the employee can review and resubmit."
          maxWidth="md"
        >
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Rejection Rationale *</label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                placeholder="e.g. Missing detailed receipt invoice or expense amount exceeds company policy."
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="outline" size="sm" onClick={() => setRejectionModalClaimId(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmRejection} size="sm" className="bg-rose-600 text-white text-xs">
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Custom Download & Export CSV Modal */}
      {isExportModalOpen && (
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Download Reimbursement Report — Custom Export Option"
          description="Choose a preset period (Daily, Weekly, Monthly, All Time) or a Custom Date Range, filter by settlement status, and export a detailed CSV ledger."
          maxWidth="lg"
        >
          <div className="space-y-4 pt-2">
            {/* Step 1: Time Range Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-brand-500" />
                1. Select Time Range / Custom Dates
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {([
                  { id: 'All Time', label: 'All Time' },
                  { id: 'Today', label: 'Daily (Today)' },
                  { id: 'This Week', label: 'Weekly' },
                  { id: 'This Month', label: 'Monthly' },
                  { id: 'Custom', label: 'Custom Range' },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setExportRangeOption(opt.id)}
                    className={`rounded-xl px-3 py-2 text-xs font-bold border transition-all text-center ${
                      exportRangeOption === opt.id
                        ? 'border-brand-500 bg-brand-500/15 text-brand-600 dark:text-brand-300 shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {exportRangeOption === 'Custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 mt-2">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      From Date (Start)
                    </label>
                    <input
                      type="date"
                      value={exportStartDate}
                      onChange={(e) => setExportStartDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1.5 text-xs focus-ring"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground block mb-1">
                      To Date (End)
                    </label>
                    <input
                      type="date"
                      value={exportEndDate}
                      onChange={(e) => setExportEndDate(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-background px-3 py-1.5 text-xs focus-ring"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Settlement / Payout Status Filter */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-emerald-500" />
                2. Filter by Settlement / Approval Status
              </label>
              <div className="flex flex-wrap gap-2">
                {(['All', 'Paid & Settled', 'Pending Signoff', 'Approved', 'Rejected'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setExportStatusFilter(st)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-all ${
                      exportStatusFilter === st
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
                        : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {st === 'All' ? 'All Claims' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Category Filter & Summary Row Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  3. Expense Category
                </label>
                <select
                  value={exportCategoryFilter}
                  onChange={(e) => setExportCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
                >
                  <option value="All">All Categories</option>
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportIncludeSummary}
                    onChange={(e) => setExportIncludeSummary(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    Include Summary Totals Footer in CSV
                  </span>
                </label>
              </div>
            </div>

            {/* Live Preview Summary of Selected Export */}
            {(() => {
              const validPreview = customModalPreviewClaims.filter(
                (c) => c.status !== 'Cancelled' && c.status !== 'Draft'
              );
              const previewTotalAmt = validPreview.reduce((acc, c) => acc + c.amount, 0);
              const previewPaidAmt = validPreview
                .filter((c) => c.isPaid || c.status === 'Paid')
                .reduce((acc, c) => acc + c.amount, 0);
              const previewPendingAmt = validPreview
                .filter((c) => c.status === 'Pending Approval' || (c.status === 'Approved' && !c.isPaid))
                .reduce((acc, c) => acc + c.amount, 0);

              return (
                <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 dark:text-brand-300">
                      Export Preview ({customModalPreviewClaims.length} Matching Claims)
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {exportRangeOption === 'Custom'
                        ? `${exportStartDate} → ${exportEndDate}`
                        : TIME_RANGE_DISPLAY_LABELS[exportRangeOption]}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="rounded-xl bg-card p-2.5 border border-zinc-200/80 dark:border-zinc-800">
                      <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                        Total Claimed
                      </span>
                      <span className="text-sm font-extrabold text-foreground">
                        ₹{previewTotalAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="rounded-xl bg-card p-2.5 border border-emerald-500/30">
                      <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">
                        Paid &amp; Settled
                      </span>
                      <span className="text-sm font-extrabold text-emerald-500">
                        ₹{previewPaidAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="rounded-xl bg-card p-2.5 border border-amber-500/30">
                      <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                        Pending Signoff
                      </span>
                      <span className="text-sm font-extrabold text-amber-500">
                        ₹{previewPendingAmt.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateRangeOption(exportRangeOption);
                  if (exportRangeOption === 'Custom') {
                    setCustomStartDate(exportStartDate);
                    setCustomEndDate(exportEndDate);
                  }
                  setSelectedCategoryFilter(exportCategoryFilter);
                  setIsExportModalOpen(false);
                  toast.success('Time range filters applied to page view!');
                }}
                className="text-xs"
              >
                Apply Range to Page View
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsExportModalOpen(false)} className="text-xs">
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleExecuteCustomExport}
                  size="sm"
                  className="gap-1.5 ambizcon-gradient text-white text-xs font-bold shadow-glow"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download Custom CSV ({customModalPreviewClaims.length})
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

