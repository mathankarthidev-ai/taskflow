'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { ReimbursementClaim } from '@/types';
import {
  fetchReimbursementsAction,
  approveClaimAdminAction,
  markClaimPaidAction,
} from '@/actions/reimbursementActions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { getReceiptImageUrl } from '@/lib/receipt-helper';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Building2,
  Download,
  ShieldAlert,
  ArrowUpRight,
  Edit3,
  Calendar,
  Eye,
  CreditCard,
  Phone,
  Home,
  FileText,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Check,
  Zap,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany } from '@/lib/company-filter';

export default function FinancePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';
  const activeCompanyScope = isAustralia ? 'Ambizcon' : 'Ambizcon Health - India';

  // Dynamic Editable Financial Figures
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [totalSalaries, setTotalSalaries] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [manualClaimsOverride, setManualClaimsOverride] = useState<number | null>(null);
  const [reimbursementClaims, setReimbursementClaims] = useState<ReimbursementClaim[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(true);

  // Edit Metric Modal
  const [isEditMetricModalOpen, setIsEditMetricModalOpen] = useState(false);
  const [editRevenue, setEditRevenue] = useState(grossRevenue.toString());
  const [editSalaries, setEditSalaries] = useState(totalSalaries.toString());
  const [editExpenses, setEditExpenses] = useState(totalExpenses.toString());
  const [editClaims, setEditClaims] = useState('0');

  // Roster Month Selector
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  // Claims Table Filter & Search
  const [claimStatusFilter, setClaimStatusFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>('all');
  const [claimsSearchQuery, setClaimsSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Receipt Preview Modal
  const [selectedReceiptClaim, setSelectedReceiptClaim] = useState<ReimbursementClaim | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Download Report Filter State
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom' | 'annual'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // View Member Details Modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMember, setSelectedMember] = useState<any>(null);

  // Auto-Load and Real-Time Sync on Reimbursements
  useEffect(() => {
    let isMounted = true;
    const loadClaims = async () => {
      try {
        setClaimsLoading(true);
        const res = await fetchReimbursementsAction();
        if (isMounted && res) {
          setReimbursementClaims(
            res.filter((c) => !String(c._id).startsWith('claim_seed_'))
          );
        }
      } catch (err) {
        console.warn('Failed to load reimbursement claims for finance:', err);
      } finally {
        if (isMounted) setClaimsLoading(false);
      }
    };
    loadClaims();

    // Supabase real-time subscription on reimbursements table
    const channel = supabase
      .channel('finance_reimbursements_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reimbursements' }, () => {
        loadClaims();
      })
      .subscribe();

    const handleRefresh = () => loadClaims();
    window.addEventListener('ambizcon_reimbursements_updated', handleRefresh);
    window.addEventListener('ambizcon_workspace_refresh', handleRefresh);
    window.addEventListener('storage', handleRefresh);

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
      window.removeEventListener('ambizcon_reimbursements_updated', handleRefresh);
      window.removeEventListener('ambizcon_workspace_refresh', handleRefresh);
      window.removeEventListener('storage', handleRefresh);
    };
  }, []);

  // Filter claims strictly by active company branch & remove drafts/rejected
  const branchClaims = useMemo(() => {
    return reimbursementClaims.filter(
      (c) =>
        isUserInCompany({ userId: c.userId, userName: c.userName, company: c.company }, activeCompanyScope) &&
        c.status !== 'Draft' &&
        c.status !== 'Rejected' &&
        c.adminStatus !== 'rejected'
    );
  }, [reimbursementClaims, activeCompanyScope]);

  // Breakdown by status
  const paidClaims = useMemo(
    () => branchClaims.filter((c) => c.isPaid || c.status === 'Paid'),
    [branchClaims]
  );
  const approvedClaims = useMemo(
    () =>
      branchClaims.filter(
        (c) =>
          (c.status === 'Approved' || c.adminStatus === 'approved') &&
          !c.isPaid &&
          c.status !== 'Paid'
      ),
    [branchClaims]
  );
  const pendingClaims = useMemo(
    () =>
      branchClaims.filter(
        (c) =>
          c.status === 'Pending Approval' &&
          c.adminStatus !== 'approved' &&
          !c.isPaid
      ),
    [branchClaims]
  );

  // Auto-calculated totals
  const totalPaidAmount = useMemo(
    () => paidClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [paidClaims]
  );
  const totalApprovedAmount = useMemo(
    () => approvedClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [approvedClaims]
  );
  const totalPendingAmount = useMemo(
    () => pendingClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [pendingClaims]
  );
  const totalAutoAddedClaims = useMemo(
    () => branchClaims.reduce((sum, c) => sum + Number(c.amount || 0), 0),
    [branchClaims]
  );

  // Total claims used in Financial Profit & Loss calculation:
  // Auto-adds all active branch claims by default, or uses manual override if specifically set by admin
  const totalClaims =
    manualClaimsOverride !== null ? manualClaimsOverride : totalAutoAddedClaims;

  // Derived Financial Calculations
  const netProfit = grossRevenue - (totalSalaries + totalExpenses + totalClaims);
  const profitMargin = ((netProfit / (grossRevenue || 1)) * 100).toFixed(1);

  // Categorized Reimbursements Data (Auto-populated from all branch claims)
  const claimCategories = useMemo(() => {
    const sumByCategoryMatch = (keywords: string[]) => {
      const matched = branchClaims.filter((c) =>
        keywords.some((kw) => (c.category || '').toLowerCase().includes(kw.toLowerCase()))
      );
      return {
        amount: matched.reduce((s, c) => s + Number(c.amount || 0), 0),
        count: matched.length,
      };
    };

    return [
      { category: 'Client Lunch & Meetings', ...sumByCategoryMatch(['lunch', 'food', 'client', 'meal']), color: '#10b981' },
      { category: 'Travel & Commute', ...sumByCategoryMatch(['travel', 'commute']), color: '#3b82f6' },
      { category: 'Software & Cloud SaaS', ...sumByCategoryMatch(['software', 'cloud', 'saas']), color: '#8b5cf6' },
      { category: 'Hardware & Equipment', ...sumByCategoryMatch(['equipment', 'hardware']), color: '#f59e0b' },
      { category: 'Office Supplies & Utilities', ...sumByCategoryMatch(['office', 'supplies', 'utilities']), color: '#ec4899' },
      { category: 'Medical & Healthcare', ...sumByCategoryMatch(['medical', 'health']), color: '#06b6d4' },
    ];
  }, [branchClaims]);

  // Filtered claims for the live table
  const displayedClaims = useMemo(() => {
    return branchClaims.filter((c) => {
      // 1. Status Filter
      if (claimStatusFilter === 'pending') {
        if (c.status !== 'Pending Approval' || c.adminStatus === 'approved' || c.isPaid) return false;
      } else if (claimStatusFilter === 'approved') {
        if ((c.status !== 'Approved' && c.adminStatus !== 'approved') || c.isPaid || c.status === 'Paid') return false;
      } else if (claimStatusFilter === 'paid') {
        if (!c.isPaid && c.status !== 'Paid') return false;
      }

      // 2. Search query
      if (claimsSearchQuery.trim()) {
        const q = claimsSearchQuery.toLowerCase().trim();
        const noMatch = (c.claimNo || '').toLowerCase().includes(q);
        const nameMatch = (c.userName || '').toLowerCase().includes(q);
        const catMatch = (c.category || '').toLowerCase().includes(q);
        const descMatch = (c.description || '').toLowerCase().includes(q);
        const teamMatch = (c.userTeam || '').toLowerCase().includes(q);
        if (!noMatch && !nameMatch && !catMatch && !descMatch && !teamMatch) return false;
      }

      return true;
    });
  }, [branchClaims, claimStatusFilter, claimsSearchQuery]);

  // Executive Actions directly from Finance Page
  const handleApproveFromFinance = async (claimId: string, claimNo: string) => {
    setActionLoadingId(claimId);
    try {
      await approveClaimAdminAction(claimId);
      setReimbursementClaims((prev) =>
        prev.map((c) =>
          c._id === claimId
            ? { ...c, adminStatus: 'approved', ceoStatus: 'approved', status: 'Approved' }
            : c
        )
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ambizcon_reimbursements_updated'));
        window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
      }
      toast.success(`Claim ${claimNo} approved and updated in Company Financials!`);
    } catch {
      toast.error(`Failed to approve claim ${claimNo}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkPaidFromFinance = async (claimId: string, claimNo: string) => {
    setActionLoadingId(claimId);
    try {
      await markClaimPaidAction(claimId);
      setReimbursementClaims((prev) =>
        prev.map((c) =>
          c._id === claimId
            ? { ...c, isPaid: true, status: 'Paid', adminStatus: 'approved' }
            : c
        )
      );
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ambizcon_reimbursements_updated'));
        window.dispatchEvent(new CustomEvent('ambizcon_workspace_refresh'));
      }
      toast.success(`Claim ${claimNo} marked as Paid Out & archived in Ledger!`);
    } catch {
      toast.error(`Failed to mark claim ${claimNo} as paid`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    setGrossRevenue(Number(editRevenue) || 0);
    setTotalSalaries(Number(editSalaries) || 0);
    setTotalExpenses(Number(editExpenses) || 0);
    if (editClaims === '' || editClaims === totalAutoAddedClaims.toString()) {
      setManualClaimsOverride(null);
    } else {
      setManualClaimsOverride(Number(editClaims) || 0);
    }
    toast.success('Executive financial metrics updated successfully!');
    setIsEditMetricModalOpen(false);
  };

  // Employee Salary Payroll Roster Data
  const salaryRoster = [
    { name: 'Anirudh', email: 'anirudh@ambizcon.com', role: 'Super Admin (CEO)', team: 'Development', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Mathan', email: 'mathan@ambizcon.com', role: 'Super Admin (AI PM)', team: 'Development', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Aravind', email: 'aravind@ambizcon.com', role: 'Team Lead', team: 'Development', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Kenneth', email: 'kenneth@ambizcon.com', role: 'Team Lead', team: 'Marketing', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Brisbane HQ' },
    { name: 'Deva', email: 'deva@ambizcon.com', role: 'Team Lead', team: 'Creative', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Thanikaivel', email: 'thanikaivel@ambizcon.com', role: 'Team Member', team: 'Development', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Naraine', email: 'naraine@ambizcon.com', role: 'Team Member', team: 'Development', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Mathanmk', email: 'mathanmk@ambizcon.com', role: 'Team Member', team: 'Development', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Mathi Pandian', email: 'mathi.p@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Kiruthikashri M', email: 'kiruthikashri@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Siddesh', email: 'siddesh@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Sathish', email: 'sathish@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Kavish TG', email: 'kavish@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Kasthuri', email: 'kasthuri@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'Ahamed', email: 'ahamed@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Chennai HQ' },
    { name: 'A. Abdul kani', email: 'abdul@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '81908 02155', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Anna Nagar, Chennai' },
    { name: 'Adriana Ruju', email: 'adriana@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '—', bank: '—', emergency: '—', taxId: '—', blood: '—', address: 'Brisbane CBD, Australia' },
  ].filter((emp) => isUserInCompany(emp, activeCompanyScope));

  // Operational Expenses Roster
  const operationalExpenses = [
    { title: 'AWS & Vercel Cloud Server Infrastructure', category: 'Infrastructure', amount: 0, period: 'Monthly' },
    { title: 'Figma & Adobe Creative Cloud Licenses', category: 'Software Tools', amount: 0, period: 'Monthly' },
    { title: 'Chennai & Brisbane Physical Office Leases', category: 'Facilities', amount: 0, period: 'Monthly' },
    { title: 'Google Ads & Healthcare Campaign Outbound', category: 'Marketing', amount: 0, period: 'Monthly' },
    { title: 'HIPAA & Medical Compliance Audit', category: 'Legal & Audit', amount: 0, period: 'Monthly' },
  ];

  const handleExportCSV = () => {
    const periodLabel =
      reportType === 'weekly'
        ? 'Weekly Report'
        : reportType === 'monthly'
        ? `Monthly Report (${selectedMonth})`
        : reportType === 'custom'
        ? `Custom Range (${startDate || 'Start'} to ${endDate || 'End'})`
        : 'Annual Full Year Report 2026';

    const claimsRows = branchClaims.map(
      (c) =>
        `"${c.claimNo}","${c.userName}","${c.userTeam}","${c.category}",$${c.amount},"${c.date}","${c.status}","${c.isPaid ? 'PAID' : 'UNPAID'}"`
    );

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `Ambizcon Health Financial Profit & Loss Statement — ${periodLabel}`,
        `Branch Scope,${activeCompanyScope}`,
        `Gross Revenue,$${grossRevenue}`,
        `Total Payroll Salaries,$${totalSalaries}`,
        `Operational Expenses,$${totalExpenses}`,
        `Reimbursement Claims Auto-Added,$${totalClaims}`,
        `Net Profit,$${netProfit}`,
        `Profit Margin,${profitMargin}%`,
        '',
        '--- ITEMIZED AUTO-SYNCED REIMBURSEMENT CLAIMS ---',
        'Claim No,Employee,Team,Category,Amount,Date,Status,Payment State',
        ...claimsRows,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ambizcon_Financial_Statement_${reportType}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported Financial statement with all auto-synced reimbursements (${periodLabel})!`);
    setIsReportModalOpen(false);
  };

  if (!currentUser) return null;

  // Security Guard: Scoped strictly to Super Admin
  if (!isSuperAdmin) {
    return (
      <div className="py-20 text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 mx-auto">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          The Executive Finance & Profit-Loss Ledger is strictly restricted to Super Admin (CEO & Leadership).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border ambizcon-hero-banner p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl ambizcon-gradient text-white shadow-glow">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Super Admin Finance & Claims Ledger
              </h1>
              <Badge className={`text-[10px] ${
                isAustralia
                  ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
              }`}>
                Restricted Executive View
              </Badge>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                <Zap className="h-3 w-3 text-amber-500" />
                Auto-Synced AmbizClaim Live
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Salary Payroll • Employee Claims Auto-Added • Expenses • Real Profit & Loss
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => {
              setEditRevenue(grossRevenue.toString());
              setEditSalaries(totalSalaries.toString());
              setEditExpenses(totalExpenses.toString());
              setEditClaims(totalClaims.toString());
              setIsEditMetricModalOpen(true);
            }}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
          >
            <Edit3 className="h-4 w-4" />
            Update Financial Metrics
          </Button>

          <Button onClick={() => setIsReportModalOpen(true)} size="sm" className="gap-1.5 ambizcon-gradient text-white shadow-glow">
            <Download className="h-4 w-4" />
            Download Full Statement & Claims CSV
          </Button>
        </div>
      </div>

      {/* Financial Executive Summary Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Revenue */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Gross Revenue
            </span>
            <button
              onClick={() => setIsEditMetricModalOpen(true)}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Revenue"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-1 font-mono">
            ${grossRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-1">
            {grossRevenue === 0 ? 'Set monthly revenue' : 'Monthly client revenue'}
          </span>
        </Card>

        {/* Employee Salaries */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Payroll Salaries
            </span>
            <button
              onClick={() => setIsEditMetricModalOpen(true)}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Payroll"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 mt-1 font-mono">
            ${totalSalaries.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">
            {salaryRoster.length} Roster Employees
          </span>
        </Card>

        {/* Operational Expenses */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Operational Expenses
            </span>
            <button
              onClick={() => setIsEditMetricModalOpen(true)}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Expenses"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 font-mono">
            ${totalExpenses.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">SaaS, Cloud & Rent</span>
        </Card>

        {/* Reimbursement Claims (Auto-Added from AmbizClaim) */}
        <Card className="p-5 border border-amber-500/30 bg-amber-500/5 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Receipt className="h-3.5 w-3.5 text-amber-500" />
              Reimbursements (Auto-Added)
            </span>
            <button
              onClick={() => setIsEditMetricModalOpen(true)}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title="Adjust Claims Settings"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1 font-mono">
            ${totalClaims.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[10px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              ${totalPaidAmount.toLocaleString()} Paid
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              ${totalPendingAmount.toLocaleString()} Pending ({pendingClaims.length})
            </span>
          </div>
        </Card>

        {/* Net Profit */}
        <Card className="p-5 border border-emerald-500/30 bg-emerald-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Net Profit (Margin)
          </span>
          <div className={`text-2xl font-extrabold mt-1 font-mono ${
            netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {netProfit >= 0 ? `+$${netProfit.toLocaleString()}` : `-$${Math.abs(netProfit).toLocaleString()}`}
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold block mt-1">
            {profitMargin}% Net Margin
          </span>
        </Card>
      </div>

      {/* Main Grid: Categorized Reimbursements & Operational Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categorized Reimbursements Card */}
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Categorized AmbizClaim Reimbursements</h3>
                <p className="text-[11px] text-muted-foreground">Auto-grouped from employee reimbursement claims</p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-mono text-[10px]">
              ${totalClaims.toLocaleString()} Total Auto-Added
            </Badge>
          </div>

          <div className="space-y-3">
            {claimCategories.map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <div>
                    <span className="font-bold text-foreground block">{c.category}</span>
                    <span className="text-[10px] text-muted-foreground">{c.count} {c.count === 1 ? 'Claim' : 'Claims'} Auto-Synced</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold font-mono text-foreground block">${c.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {totalClaims > 0 ? ((c.amount / totalClaims) * 100).toFixed(1) : '0.0'}% of claims
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Operational Expenses Ledger */}
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Operational Expenses Ledger</h3>
                <p className="text-[11px] text-muted-foreground">Recurring software, leases, & infrastructure</p>
              </div>
            </div>
            <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 font-mono text-[10px]">
              ${totalExpenses.toLocaleString()}/mo
            </Badge>
          </div>

          <div className="space-y-3">
            {operationalExpenses.map((ex) => (
              <div
                key={ex.title}
                className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs"
              >
                <div>
                  <span className="font-bold text-foreground block">{ex.title}</span>
                  <span className="text-[10px] text-muted-foreground">{ex.category} • {ex.period}</span>
                </div>
                <span className="font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  ${ex.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Auto-Synced Reimbursement Claims Table in Company Financials */}
      <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="p-5 border-b border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Auto-Synced AmbizClaim Company Ledger</h3>
                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                  {branchClaims.length} Active Claims
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                All employee reimbursement claims submitted in AmbizClaim are automatically added here to Company Financials.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={claimsSearchQuery}
                onChange={(e) => setClaimsSearchQuery(e.target.value)}
                placeholder="Search claim, employee, category..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background focus-ring w-48 sm:w-60"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 text-xs">
              <button
                type="button"
                onClick={() => setClaimStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  claimStatusFilter === 'all'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All ({branchClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setClaimStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  claimStatusFilter === 'pending'
                    ? 'bg-background text-amber-600 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pending ({pendingClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setClaimStatusFilter('approved')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  claimStatusFilter === 'approved'
                    ? 'bg-background text-blue-600 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Approved ({approvedClaims.length})
              </button>
              <button
                type="button"
                onClick={() => setClaimStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  claimStatusFilter === 'paid'
                    ? 'bg-background text-emerald-600 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Paid Out ({paidClaims.length})
              </button>
            </div>
          </div>
        </div>

        {/* Claims Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Claim ID</th>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date Filed</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Receipt Document</th>
                <th className="px-4 py-3 text-right">Executive Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:border-zinc-800/60">
              {claimsLoading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Auto-syncing reimbursement claims from database...
                  </td>
                </tr>
              ) : displayedClaims.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted-foreground">
                    No reimbursement claims found matching this filter.
                  </td>
                </tr>
              ) : (
                displayedClaims.map((claim) => {
                  const receiptImg = getReceiptImageUrl(claim.receiptName, claim.receiptUrl);
                  const isPending =
                    claim.status === 'Pending Approval' &&
                    claim.adminStatus !== 'approved' &&
                    !claim.isPaid;
                  const isApproved =
                    (claim.status === 'Approved' || claim.adminStatus === 'approved') &&
                    !claim.isPaid &&
                    claim.status !== 'Paid';
                  const isPaid = claim.isPaid || claim.status === 'Paid';

                  return (
                    <tr key={claim._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-foreground">
                        {claim.claimNo}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            src={claim.userAvatar}
                            name={claim.userName}
                            userId={claim.userId}
                            size="sm"
                          />
                          <div>
                            <span className="font-semibold text-foreground block">{claim.userName}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{claim.userId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{claim.userTeam}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] font-semibold">
                          {claim.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono font-extrabold text-foreground text-sm">
                          ${claim.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-[11px]">
                        {claim.date}
                      </td>
                      <td className="px-4 py-3">
                        {isPaid ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Paid Out
                          </Badge>
                        ) : isApproved ? (
                          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">
                            <Check className="h-3 w-3 mr-1" /> Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                            <Clock className="h-3 w-3 mr-1" /> Pending Approval
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {receiptImg ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedReceiptClaim(claim);
                              setIsReceiptModalOpen(true);
                            }}
                            className="h-7 text-[11px] gap-1 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View Receipt
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">No attachment</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <Button
                                type="button"
                                size="sm"
                                disabled={actionLoadingId === claim._id}
                                onClick={() => handleApproveFromFinance(claim._id, claim.claimNo)}
                                className="h-7 text-[10px] font-bold ambizcon-gradient text-white px-2.5 shadow-xs"
                              >
                                {actionLoadingId === claim._id ? 'Processing...' : 'Approve'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={actionLoadingId === claim._id}
                                onClick={() => handleMarkPaidFromFinance(claim._id, claim.claimNo)}
                                className="h-7 text-[10px] font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 px-2.5"
                              >
                                Pay Out
                              </Button>
                            </>
                          )}
                          {isApproved && (
                            <Button
                              type="button"
                              size="sm"
                              disabled={actionLoadingId === claim._id}
                              onClick={() => handleMarkPaidFromFinance(claim._id, claim.claimNo)}
                              className="h-7 text-[10px] font-bold ambizcon-gradient text-white px-3 shadow-xs"
                            >
                              {actionLoadingId === claim._id ? 'Processing...' : 'Mark as Paid'}
                            </Button>
                          )}
                          {isPaid && (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                              ✓ Reconciled
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Employee Salary Payroll Roster Ledger Table */}
      <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80">
        <div className="p-5 border-b border-zinc-200/60 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-foreground">Employee Salary Payroll Roster</h3>
                <Badge className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">
                  {salaryRoster.length} Roster Employees
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Branch employee salary allocations and confidential bank records.
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Authorized Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Base Salary</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">Location HQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/60 dark:border-zinc-800/60">
              {salaryRoster.map((emp) => (
                <tr key={emp.email} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-foreground">{emp.name}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{emp.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">{emp.role}</Badge>
                  </td>
                  <td className="px-4 py-3 font-medium">{emp.team}</td>
                  <td className="px-4 py-3 font-mono font-bold text-foreground">${emp.salary.toLocaleString()}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{emp.phone}</td>
                  <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{emp.bank}</td>
                  <td className="px-4 py-3 text-muted-foreground">{emp.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receipt Preview Modal */}
      <Modal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedReceiptClaim(null);
        }}
        title={`Receipt Attachment • ${selectedReceiptClaim?.claimNo || 'Claim'}`}
        description={`Submitted by ${selectedReceiptClaim?.userName || 'Employee'} on ${selectedReceiptClaim?.date || ''} for $${selectedReceiptClaim?.amount?.toLocaleString() || '0'}`}
        maxWidth="lg"
      >
        <div className="space-y-4 pt-2">
          {selectedReceiptClaim && (
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
              <img
                src={getReceiptImageUrl(selectedReceiptClaim.receiptName, selectedReceiptClaim.receiptUrl)}
                alt={selectedReceiptClaim.receiptName || 'Receipt'}
                className="max-h-[500px] w-auto max-w-full rounded-xl object-contain border border-zinc-200 dark:border-zinc-800 shadow-md"
              />
              <div className="mt-3 flex items-center justify-between w-full text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{selectedReceiptClaim.receiptName || 'Receipt Document'}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">${selectedReceiptClaim.amount.toLocaleString()}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setIsReceiptModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Executive Financial Metrics Modal */}
      <Modal
        isOpen={isEditMetricModalOpen}
        onClose={() => setIsEditMetricModalOpen(false)}
        title="Update Executive Financial Metrics"
        description="Super Admin interface to update Gross Revenue, Payroll Salaries, Expenses, and Claims."
        maxWidth="md"
      >
        <form onSubmit={handleSaveMetrics} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Gross Revenue ($ / mo)</label>
            <input
              type="number"
              value={editRevenue}
              onChange={(e) => setEditRevenue(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Total Payroll Salaries ($ / mo)</label>
            <input
              type="number"
              value={editSalaries}
              onChange={(e) => setEditSalaries(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Operational Expenses ($ / mo)</label>
            <input
              type="number"
              value={editExpenses}
              onChange={(e) => setEditExpenses(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Reimbursements ($ / mo)</label>
              <button
                type="button"
                onClick={() => setEditClaims(totalAutoAddedClaims.toString())}
                className="text-[10px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
              >
                Use Live Auto-Calculated (${totalAutoAddedClaims.toLocaleString()})
              </button>
            </div>
            <input
              type="number"
              value={editClaims}
              onChange={(e) => setEditClaims(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
              required
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Live claims auto-total from AmbizClaim is <strong>${totalAutoAddedClaims.toLocaleString()}</strong>.
            </p>
          </div>

          <div className="p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Calculated Net Profit:</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
              +${(Number(editRevenue) - (Number(editSalaries) + Number(editExpenses) + Number(editClaims))).toLocaleString()}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsEditMetricModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
              Save Metrics
            </Button>
          </div>
        </form>
      </Modal>

      {/* Multi-Filter Report Downloader Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Download Financial & Employee Roster Report"
        description="Select report interval to download complete financial statement with all auto-synced reimbursement claims."
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Report Period Interval</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="weekly">Weekly Financial Summary</option>
              <option value="monthly">Monthly Financial Report ({selectedMonth})</option>
              <option value="custom">Custom Date Range Filter</option>
              <option value="annual">Annual Statement (FY 2026 Full Year)</option>
            </select>
          </div>

          {reportType === 'custom' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button variant="outline" onClick={() => setIsReportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportCSV} className="ambizcon-gradient text-white shadow-glow">
              Download Complete CSV Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
