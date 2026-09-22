'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ReimbursementClaim, ClaimCategory } from '@/types';
import {
  fetchReimbursementsAction,
  submitReimbursementAction,
  approveClaimTLAction,
  approveClaimCEOAction,
  markClaimPaidAction,
  rejectClaimAction,
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store/useCompanyStore';

export default function ReimbursementsPage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon - Australia'
    : currentUser?.company === 'Ambizcon - Australia';
  const isTeamLead = currentUser?.role === 'Team Lead' || isSuperAdmin;
  const [claims, setClaims] = useState<ReimbursementClaim[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [category, setCategory] = useState<ClaimCategory>('Client Lunch');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Category Filter
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<ClaimCategory | 'All'>('All');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await fetchReimbursementsAction();
      setClaims(res);
      setLoading(false);
    }
    loadData();
  }, []);

  if (!currentUser) return null;

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error('Please enter a valid claim amount');
      return;
    }
    if (!date) {
      toast.error('Please select expense date');
      return;
    }
    if (!description.trim()) {
      toast.error('Please enter expense description');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitReimbursementAction({
        userId: currentUser._id,
        userName: currentUser.name,
        userTeam: currentUser.team,
        userAvatar: currentUser.avatar,
        category,
        amount: Number(amount),
        date,
        description: description.trim(),
        receiptName: receiptName.trim() || 'expense_receipt.pdf',
      });

      setClaims([created, ...claims]);
      toast.success(`Claim ${created.claimNo} submitted successfully!`);
      setIsSubmitModalOpen(false);

      // Reset
      setAmount('');
      setDescription('');
      setDate('');
      setReceiptName('');
    } catch (err) {
      toast.error('Failed to submit claim');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveTL = async (id: string) => {
    const updated = await approveClaimTLAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      toast.success(`Claim approved by Team Leader! Sent to CEO for finance payout signoff.`);
    }
  };

  const handleApproveCEO = async (id: string) => {
    const updated = await approveClaimCEOAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      toast.success(`Claim fully approved by CEO! Ready for finance payout.`);
    }
  };

  const handleMarkPaid = async (id: string) => {
    const updated = await markClaimPaidAction(id);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      toast.success(`Claim marked as PAID out! Receipt archived.`);
    }
  };

  const handleReject = async (id: string, role: 'tl' | 'ceo') => {
    const updated = await rejectClaimAction(id, role);
    if (updated) {
      setClaims(claims.map((c) => (c._id === id ? updated : c)));
      toast.error(`Claim rejected.`);
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Claim No,Employee,Team,Category,Amount (INR),Date,Status,Paid Out']
        .concat(
          claims.map(
            (c) => `${c.claimNo},"${c.userName}",${c.userTeam},${c.category},${c.amount},${c.date},${c.status},${c.isPaid ? 'Yes' : 'No'}`
          )
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `AmbizClaim_Reimbursements_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Reimbursement claims report exported to CSV!');
  };

  const filteredClaims = claims.filter((c) => {
    if (selectedCategoryFilter !== 'All' && c.category !== selectedCategoryFilter) return false;
    return true;
  });

  const totalClaimed = claims.reduce((acc, c) => acc + c.amount, 0);
  const totalPaid = claims.filter((c) => c.isPaid).reduce((acc, c) => acc + c.amount, 0);
  const totalPending = claims.filter((c) => !c.isPaid && c.status !== 'Rejected').reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#086075]/15 via-[#2a8c82]/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-glow border overflow-hidden ${
            isAustralia ? 'bg-white p-2 border-amber-500/40' : 'border-emerald-500/30'
          }`}>
            <img
              src={isAustralia ? '/ambizcon-australia-icon.png' : '/ambizcon-logo.png'}
              alt={isAustralia ? 'AMBIZCON Australia Logo' : 'AMBIZCON Health Logo'}
              className={`h-full w-full ${isAustralia ? 'object-contain' : 'object-cover'}`}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                AmbizClaim — Expense & Reimbursements
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold border-emerald-500/30">
                Finance Portal
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Submit Expense Claims • Receipt Verification • TL & CEO 2-Step Approval • Finance Payout
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
            Export Claims
          </Button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Total Claims Submitted
          </span>
          <div className="text-2xl font-extrabold text-foreground mt-1">₹{totalClaimed.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">{claims.length} Claims Total</span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Paid Out (Disbursed)
          </span>
          <div className="text-2xl font-extrabold text-emerald-500 mt-1">₹{totalPaid.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">
            {claims.filter((c) => c.isPaid).length} Claims Settled
          </span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Pending Approval Payout
          </span>
          <div className="text-2xl font-extrabold text-amber-500 mt-1">₹{totalPending.toLocaleString('en-IN')}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">In Approval Queue</span>
        </Card>

        <Card className="p-4 border border-zinc-200/80 dark:border-zinc-800/80">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Action Required
          </span>
          <div className="text-2xl font-extrabold text-brand-500 mt-1">
            {claims.filter((c) => c.status !== 'Paid' && c.status !== 'Rejected').length}
          </div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Claims Awaiting Signoff</span>
        </Card>
      </div>

      {/* Category Quick Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-[10px] mr-1">
          Filter Category:
        </span>
        <button
          onClick={() => setSelectedCategoryFilter('All')}
          className={`rounded-full px-3.5 py-1 text-xs font-bold border transition-all ${
            selectedCategoryFilter === 'All'
              ? 'border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300'
              : 'border-zinc-200 dark:border-zinc-800 bg-card text-muted-foreground hover:text-foreground'
          }`}
        >
          All Categories ({claims.length})
        </button>

        {['Client Lunch', 'Travel', 'Software', 'Equipment', 'Office Supplies', 'Medical'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategoryFilter(cat as ClaimCategory)}
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

      {/* Claims Table & Management */}
      <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">Reimbursement Claims Ledger</h3>
            <p className="text-xs text-muted-foreground">
              Review expense receipts, verify manager signoffs, and trigger payout settlement.
            </p>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {filteredClaims.length} Claims
          </Badge>
        </div>

        <div className="space-y-4">
          {filteredClaims.map((claim) => {
            const isPendingTL = claim.tlStatus === null;
            const isPendingCEO = claim.tlStatus === 'approved' && claim.ceoStatus === null;
            const isReadyPaid = claim.ceoStatus === 'approved' && !claim.isPaid;

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
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 italic">"{claim.description}"</p>
                  </div>
                </div>

                {/* Receipt Badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-semibold border border-brand-500/30 bg-brand-500/10 px-2.5 py-1 rounded-lg">
                    <FileText className="h-3.5 w-3.5" />
                    {claim.receiptName}
                  </span>
                </div>

                {/* 2-Step Approval Status Pills */}
                <div className="flex items-center gap-2 text-xs">
                  <Badge
                    className={
                      claim.tlStatus === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                        : claim.tlStatus === 'rejected'
                        ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                    }
                  >
                    TL: {claim.tlStatus === 'approved' ? '✓ Approved' : claim.tlStatus === 'rejected' ? '✗ Rejected' : '... Pending'}
                  </Badge>

                  <ArrowRight className="h-3 w-3 text-muted-foreground" />

                  <Badge
                    className={
                      claim.ceoStatus === 'approved'
                        ? 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
                        : claim.ceoStatus === 'rejected'
                        ? 'bg-rose-500/20 text-rose-600 border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-600 border-amber-500/30'
                    }
                  >
                    CEO: {claim.ceoStatus === 'approved' ? '✓ Approved' : claim.ceoStatus === 'rejected' ? '✗ Rejected' : '... Pending'}
                  </Badge>

                  {claim.isPaid && (
                    <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/30 font-extrabold">
                      PAID OUT
                    </Badge>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2">
                  {isTeamLead && isPendingTL && (
                    <div className="flex items-center gap-1">
                      <Button onClick={() => handleApproveTL(claim._id)} size="sm" className="bg-emerald-600 text-white text-xs py-1">
                        TL Approve
                      </Button>
                      <Button onClick={() => handleReject(claim._id, 'tl')} size="sm" variant="ghost" className="text-rose-500 text-xs py-1">
                        Reject
                      </Button>
                    </div>
                  )}

                  {isSuperAdmin && isPendingCEO && (
                    <div className="flex items-center gap-1">
                      <Button onClick={() => handleApproveCEO(claim._id)} size="sm" className="ambizcon-gradient text-white text-xs py-1 shadow-glow">
                        CEO Approve
                      </Button>
                      <Button onClick={() => handleReject(claim._id, 'ceo')} size="sm" variant="ghost" className="text-rose-500 text-xs py-1">
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
      </Card>

      {/* Submit Claim Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Submit Reimbursement Claim"
        description="Upload expense receipt and submit claim to TL and CEO approval chain."
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitClaim} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ClaimCategory)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Client Lunch">Client Lunch</option>
                <option value="Travel">Travel</option>
                <option value="Software">Software & SaaS</option>
                <option value="Equipment">Equipment & Hardware</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Medical">Medical Reimbursement</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Claim Amount (INR ₹) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 3500"
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Expense Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Receipt Document Name</label>
              <input
                type="text"
                value={receiptName}
                onChange={(e) => setReceiptName(e.target.value)}
                placeholder="e.g. hotel_bill_july.pdf"
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Expense Description & Business Rationale *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="State rationale and details for reimbursement claim..."
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="ambizcon-gradient text-white shadow-glow">
              {isSubmitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
