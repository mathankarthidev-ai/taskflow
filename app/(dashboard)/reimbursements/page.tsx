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
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store/useCompanyStore';

const DEFAULT_CATEGORIES = [
  'Client Lunch',
  'Travel',
  'Software',
  'Equipment',
  'Office Supplies',
  'Medical',
];

export default function ReimbursementsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';

  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [loading, setLoading] = useState(true);

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
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Submit Claim Modal & Multi-Item Expense Form
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [items, setItems] = useState<
    { category: string; customCategoryName?: string; amount: string; date: string; description: string; receiptName: string }[]
  >([
    {
      category: 'Client Lunch',
      customCategoryName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      receiptName: '',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail & Comments Modal
  const [selectedClaimDetail, setSelectedClaimDetail] = useState<ReimbursementClaim | null>(null);
  const [newCommentText, setNewCommentText] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  // Rejection Reason Modal
  const [rejectionModalClaimId, setRejectionModalClaimId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchReimbursementsAction();
      setClaims(res);

      // Extract existing categories
      const setCats = new Set(DEFAULT_CATEGORIES);
      res.forEach((c) => {
        if (c.category) setCats.add(c.category);
      });
      setCategoriesList(Array.from(setCats));

      setLoading(false);
    }
    loadData();
  }, []);

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
    if (file) {
      const updated = [...items];
      updated[index].receiptName = file.name;
      setItems(updated);
      toast.success(`Attached file: ${file.name}`);
    }
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
      const primaryReceipt = items[0].receiptName.trim() || 'expense_receipt.pdf';

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
          receiptName: it.receiptName.trim() || 'expense_receipt.pdf',
        };
      });

      const created = await submitReimbursementAction({
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
      });

      setClaims([created, ...claims]);
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
        },
      ]);
    } catch (err) {
      toast.error('Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status Action Handlers (Admin Approval Only)
  const handleApproveAdmin = async (id: string) => {
    const updated = await approveClaimAdminAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      if (selectedClaimDetail?._id === id) setSelectedClaimDetail(updated);
      toast.success(`Claim approved by Admin! Ready for finance payout.`);
    }
  };

  const handleMarkPaid = async (id: string) => {
    const updated = await markClaimPaidAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      if (selectedClaimDetail?._id === id) setSelectedClaimDetail(updated);
      toast.success(`Claim marked as PAID OUT! Payout record archived.`);
    }
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

    const updated = await rejectClaimAction(rejectionModalClaimId, 'admin', rejectionReasonInput.trim());
    if (updated) {
      setClaims(claims.map((c) => (c._id === rejectionModalClaimId ? updated : c)));
      if (selectedClaimDetail?._id === rejectionModalClaimId) setSelectedClaimDetail(updated);
      toast.error(`Claim rejected by Admin with documented reason.`);
      setRejectionModalClaimId(null);
    }
  };

  const handleSubmitDraft = async (id: string) => {
    const updated = await submitDraftClaimAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      toast.success('Draft claim submitted for Admin review!');
    }
  };

  const handleCancelClaim = async (id: string) => {
    const updated = await cancelClaimAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      toast.info('Claim cancelled.');
    }
  };

  const handlePostComment = async () => {
    if (!selectedClaimDetail || !newCommentText.trim()) return;
    setIsAddingComment(true);

    const updated = await addClaimCommentAction(
      selectedClaimDetail._id,
      currentUser.name,
      currentUser.role,
      newCommentText.trim()
    );

    if (updated) {
      setClaims(claims.map((c) => (c._id === updated._id ? updated : c)));
      setSelectedClaimDetail(updated);
      setNewCommentText('');
      toast.success('Comment added to audit trail');
    }
    setIsAddingComment(false);
  };

  // CSV Export for filtered claims and date range
  const handleExportCSV = () => {
    let rangeLabel = dateRangeOption.replace(/\s+/g, '_');
    if (dateRangeOption === 'Custom' && customStartDate && customEndDate) {
      rangeLabel = `${customStartDate}_to_${customEndDate}`;
    }

    const headers =
      'Claim No,Employee,Team,Company,Category,Total Amount (INR),Expense Count,Expense Date,Status,Paid Out,Rejection Reason';
    const rows = filteredClaims.map((c) => {
      const itemCount = c.items?.length || 1;
      const reason = c.rejectionReason ? `"${c.rejectionReason.replace(/"/g, '""')}"` : 'N/A';
      return `${c.claimNo},"${c.userName}",${c.userTeam},${c.company || 'Ambizcon'},${c.category},${c.amount},${itemCount},${c.date},${c.status},${c.isPaid ? 'Yes' : 'No'},${reason}`;
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers].concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AmbizClaim_Reimbursement_Report_${rangeLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Reimbursement Ledger (${dateRangeOption}) exported to CSV!`);
  };

  // Total Claim Overview Metrics (VISIBLE TO EVERYONE across organization)
  const totalOrgClaimedAmount = claims.filter((c) => c.status !== 'Cancelled' && c.status !== 'Draft').reduce((acc, c) => acc + c.amount, 0);
  const totalOrgPaidAmount = claims.filter((c) => c.isPaid).reduce((acc, c) => acc + c.amount, 0);
  const totalOrgPendingAmount = claims.filter((c) => c.status === 'Pending Approval' || (c.status === 'Approved' && !c.isPaid)).reduce((acc, c) => acc + c.amount, 0);
  const totalOrgClaimsCount = claims.length;

  // VISIBILITY FILTERING: Show self claims only for regular members, show all for Admin
  const visibleClaims = claims.filter((c) => {
    if (!isSuperAdmin) {
      // Regular user sees ONLY self claims
      return c.userId === currentUser._id;
    }
    return true; // Admin sees ALL claims
  });

  // Apply Search, Status, Category & Date Range Filters
  const filteredClaims = visibleClaims
    .filter((c) => {
      // Date Range Filter
      if (dateRangeOption !== 'All Time') {
        const claimDate = c.date || (c.createdAt ? c.createdAt.split('T')[0] : '');
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        if (dateRangeOption === 'Today') {
          if (claimDate !== todayStr) return false;
        } else if (dateRangeOption === 'This Week') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const claimTime = new Date(claimDate).getTime();
          if (claimTime < startOfWeek.getTime()) return false;
        } else if (dateRangeOption === 'This Month') {
          const currentYearMonth = now.toISOString().substring(0, 7);
          if (!claimDate.startsWith(currentYearMonth)) return false;
        } else if (dateRangeOption === 'Custom') {
          if (customStartDate && claimDate < customStartDate) return false;
          if (customEndDate && claimDate > customEndDate) return false;
        }
      }

      // Status Filter
      if (selectedStatusFilter !== 'All' && c.status !== selectedStatusFilter) return false;

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#086075]/15 via-[#2a8c82]/10 to-transparent p-6 glass-panel">
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
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border-emerald-500/30">
                {isSuperAdmin ? 'Admin Approval Portal' : 'My Claims Portal'}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Multi-Item Expenses • Mandatory Receipt (&gt; ₹200) • Daily/Weekly/Monthly Date Range Exports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setIsSubmitModalOpen(true)} className="gap-2 ambizcon-gradient text-white shadow-glow">
            <Plus className="h-4 w-4" />
            Submit Expense Claim
          </Button>

          <Button onClick={handleExportCSV} variant="outline" className="gap-1.5 text-xs">
            <Download className="h-4 w-4" />
            Export CSV ({dateRangeOption})
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards (SHOWN TO ALL MEMBERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Organization Claims
          </span>
          <div className="text-2xl font-extrabold text-foreground mt-1">
            ₹{totalOrgClaimedAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">{totalOrgClaimsCount} Total Submissions</span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Paid & Settled
          </span>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">
            ₹{totalOrgPaidAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {claims.filter((c) => c.isPaid).length} Disbursed Vouchers
          </span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Pending Admin Signoff
          </span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">
            ₹{totalOrgPendingAmount.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Awaiting Payout Signoff</span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            My Active Claims
          </span>
          <div className="text-2xl font-extrabold text-brand-500 mt-1">
            {claims.filter((c) => c.userId === currentUser._id).length}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Submitted by You</span>
        </Card>
      </div>

      {/* Date Range & Category Management Bar */}
      <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
        {/* Date Range Selector Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-zinc-100 dark:border-zinc-900">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-brand-500" />
              Time Range:
            </span>
            {(['All Time', 'Today', 'This Week', 'This Month', 'Custom'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setDateRangeOption(opt)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold border transition-all ${
                  dateRangeOption === opt
                    ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                    : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {dateRangeOption === 'Custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground text-[11px]">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring"
              />
              <span className="text-muted-foreground text-[11px]">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring"
              />
            </div>
          )}
        </div>

        {/* Category Pills & Add Custom Category */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto py-1">
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-[10px] mr-1">
              Category:
            </span>
            <button
              onClick={() => setSelectedCategoryFilter('All')}
              className={`rounded-full px-3.5 py-1 text-xs font-bold border transition-all ${
                selectedCategoryFilter === 'All'
                  ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
                  : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
              }`}
            >
              All Categories
            </button>

            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`rounded-full px-3.5 py-1 text-xs font-bold border transition-all ${
                  selectedCategoryFilter === cat
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                    : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {!isAddingNewCategory ? (
            <Button onClick={() => setIsAddingNewCategory(true)} variant="outline" size="sm" className="text-xs gap-1">
              <Plus className="h-3.5 w-3.5" />
              Add Custom Category
            </Button>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                placeholder="New Category Name..."
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1 text-xs focus-ring"
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

        {/* Search, Status & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-900">
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

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value as any)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
            >
              <option value="All">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid Out</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_high">Amount: High to Low</option>
              <option value="amount_low">Amount: Low to High</option>
            </select>
          </div>
        </div>
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

              return (
                <div
                  key={claim._id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  {/* Employee & Claim Detail */}
                  <div className="flex items-center gap-3.5 min-w-[280px]">
                    <Avatar src={claim.userAvatar} name={claim.userName} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{claim.userName}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">
                          {claim.claimNo}
                        </Badge>
                        <span className="text-[10px] font-mono text-muted-foreground">[{claim.userTeam}]</span>
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
                    </div>
                  </div>

                  {/* Inspect Button */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedClaimDetail(claim)}
                      className="inline-flex items-center gap-1.5 text-xs text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 rounded-xl hover:bg-brand-500/20 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Inspect Claim & Receipts
                    </button>
                  </div>

                  {/* Workflow Status Badge (Single Admin Approval) */}
                  <div className="flex items-center gap-2 text-xs">
                    {isDraft ? (
                      <Badge className="bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/30 font-bold">
                        DRAFT SAVED
                      </Badge>
                    ) : claim.status === 'Approved' ? (
                      <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 font-extrabold">
                        ✓ APPROVED BY ADMIN
                      </Badge>
                    ) : claim.status === 'Rejected' ? (
                      <Badge className="bg-rose-500/20 text-rose-600 border-rose-500/30 font-extrabold">
                        ✗ REJECTED
                      </Badge>
                    ) : claim.status === 'Paid' ? (
                      <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30 font-extrabold">
                        PAID OUT
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-bold">
                        ... PENDING ADMIN APPROVAL
                      </Badge>
                    )}

                    {claim.isPaid && (
                      <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30 font-extrabold">
                        PAID OUT
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

                    {claim.isPaid && (
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 text-xs border-2 border-blue-500 rounded-lg px-2.5 py-1 rotate-[-4deg]">
                        PAID OUT
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Multi-Item Create Claim Modal with > ₹200 Document Validation & Custom Categories */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Reimbursement Claim"
        description="Add line items. For any expense item above ₹200, attaching a document/receipt is mandatory."
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
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold">Any File Format</span>
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
                          {item.receiptName ? item.receiptName : 'Click to Upload Any Document / Receipt...'}
                        </span>
                        <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                          Upload File
                        </span>
                      </label>
                      <input
                        id={`file_upload_${idx}`}
                        type="file"
                        accept="*/*"
                        onChange={(e) => handleFileUpload(idx, e)}
                        className="hidden"
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground mt-0.5 block">
                      Supports PDF, PNG, JPG, DOC, DOCX, XLS, XLSX, ZIP, or any format
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
            <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
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

      {/* Claim Detail & Comments Modal */}
      {selectedClaimDetail && (
        <Modal
          isOpen={Boolean(selectedClaimDetail)}
          onClose={() => setSelectedClaimDetail(null)}
          title={`Claim ${selectedClaimDetail.claimNo} Details & Audit Log`}
          description="View itemized breakdown, receipt file metadata, and add comments to the claim discussion thread."
          maxWidth="2xl"
        >
          <div className="space-y-5 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <Avatar src={selectedClaimDetail.userAvatar} name={selectedClaimDetail.userName} size="md" />
                <div>
                  <span className="font-bold text-sm text-foreground block">{selectedClaimDetail.userName}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedClaimDetail.userTeam} • {selectedClaimDetail.company || 'Ambizcon'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-muted-foreground font-semibold block">Total Claim Amount</span>
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  ₹{selectedClaimDetail.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {selectedClaimDetail.rejectionReason && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-300 text-xs">
                <span className="font-extrabold block">Rejection Reason Documented:</span>
                <p className="mt-0.5">{selectedClaimDetail.rejectionReason}</p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Itemized Expenses</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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
                      },
                    ]
                ).map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-card text-xs"
                  >
                    <div>
                      <span className="font-bold text-foreground block">{it.category}</span>
                      <span className="text-[11px] text-muted-foreground">{it.description}</span>
                      <span className="text-[10px] font-mono text-zinc-500 block">Date: {it.date}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-foreground block">₹{it.amount.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold">
                        📄 {it.receiptName || 'receipt.pdf'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-4">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-brand-500" />
                Audit Trail & Discussion Comments ({selectedClaimDetail.comments?.length || 0})
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 mb-3">
                {!selectedClaimDetail.comments || selectedClaimDetail.comments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No discussion comments logged yet.</p>
                ) : (
                  selectedClaimDetail.comments.map((cmt) => (
                    <div key={cmt.id} className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-foreground">
                          {cmt.authorName} <span className="text-[10px] text-muted-foreground font-normal">({cmt.authorRole})</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(cmt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs">{cmt.text}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type a note or query on this claim..."
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
                />
                <Button onClick={handlePostComment} disabled={isAddingComment} size="sm" className="ambizcon-gradient text-white text-xs">
                  Add Note
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
    </div>
  );
}
