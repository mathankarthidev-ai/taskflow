'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function FinancePage() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const isSuperAdmin = currentUser?.role === 'Super Admin';

  // Dynamic Editable Financial Figures
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [totalSalaries, setTotalSalaries] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);

  // Edit Metric Modal
  const [isEditMetricModalOpen, setIsEditMetricModalOpen] = useState(false);
  const [editRevenue, setEditRevenue] = useState(grossRevenue.toString());
  const [editSalaries, setEditSalaries] = useState(totalSalaries.toString());
  const [editExpenses, setEditExpenses] = useState(totalExpenses.toString());
  const [editClaims, setEditClaims] = useState(totalClaims.toString());

  // Roster Month Selector
  const [selectedMonth, setSelectedMonth] = useState('August 2026');

  // Download Report Filter State
  const [reportType, setReportType] = useState<'weekly' | 'monthly' | 'custom' | 'annual'>('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // View Member Details Modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedMember, setSelectedMember] = useState<any>(null);

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

  // Derived Financial Calculations
  const netProfit = grossRevenue - (totalSalaries + totalExpenses + totalClaims);
  const profitMargin = ((netProfit / (grossRevenue || 1)) * 100).toFixed(1);

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    setGrossRevenue(Number(editRevenue) || 0);
    setTotalSalaries(Number(editSalaries) || 0);
    setTotalExpenses(Number(editExpenses) || 0);
    setTotalClaims(Number(editClaims) || 0);
    toast.success('Executive financial metrics updated successfully!');
    setIsEditMetricModalOpen(false);
  };

  // Categorized Reimbursements Data
  const claimCategories = [
    { category: 'Travel & Commute', amount: 0, count: 0, color: '#3b82f6' },
    { category: 'Client Lunch & Meetings', amount: 0, count: 0, color: '#10b981' },
    { category: 'Software & Cloud SaaS', amount: 0, count: 0, color: '#8b5cf6' },
    { category: 'Hardware & Equipment', amount: 0, count: 0, color: '#f59e0b' },
    { category: 'Office Supplies & Utilities', amount: 0, count: 0, color: '#ec4899' },
    { category: 'Medical & Healthcare', amount: 0, count: 0, color: '#06b6d4' },
  ];

  // Employee Salary Payroll Roster Data with Personal & Bank Details
  const salaryRoster = [
    { name: 'Anirudh', email: 'anirudh@ambizcon.com', role: 'Super Admin (CEO)', team: 'Development', salary: 0, phone: '+91 98765 43210', bank: 'HDFC Bank • XXXX-XXXX-4821', emergency: 'Spouse: +91 98765 00000', taxId: 'ANIR1234F', blood: 'O+', address: 'No. 1, Ambizcon Towers, Chennai' },
    { name: 'Mathan', email: 'mathan@ambizcon.com', role: 'Super Admin (AI PM)', team: 'Development', salary: 0, phone: '+91 98765 43211', bank: 'ICICI Bank • XXXX-XXXX-9102', emergency: 'Brother: +91 98765 11111', taxId: 'MATH5678G', blood: 'B+', address: 'No. 14, Tech Corridor, Chennai' },
    { name: 'Aravind', email: 'aravind@ambizcon.com', role: 'Team Lead', team: 'Development', salary: 0, phone: '+91 98765 43212', bank: 'Axis Bank • XXXX-XXXX-3341', emergency: 'Father: +91 98765 22222', taxId: 'ARAV9012H', blood: 'A+', address: 'No. 88, IT Expressway, Chennai' },
    { name: 'Kenneth', email: 'kenneth@ambizcon.com', role: 'Team Lead', team: 'Marketing', salary: 0, phone: '+91 98765 43213', bank: 'NAB Australia • XXXX-XXXX-5520', emergency: 'Wife: +61 412 345 678', taxId: 'KENN3456I', blood: 'O+', address: '124 Queen St, Brisbane QLD' },
    { name: 'Deva', email: 'deva@ambizcon.com', role: 'Team Lead', team: 'Creative', salary: 0, phone: '+91 98765 43214', bank: 'SBI Bank • XXXX-XXXX-8812', emergency: 'Mother: +91 98765 44444', taxId: 'DEVA7890J', blood: 'AB+', address: 'No. 5, Design Street, Chennai' },
    { name: 'Thanikaivel', email: 'thanikaivel@ambizcon.com', role: 'Team Member', team: 'Development', salary: 0, phone: '+91 98765 43215', bank: 'HDFC Bank • XXXX-XXXX-1122', emergency: 'Father: +91 98765 55555', taxId: 'THAN1234K', blood: 'O+', address: 'No. 23, Dev Colony, Chennai' },
    { name: 'Naraine', email: 'naraine@ambizcon.com', role: 'Team Member', team: 'Development', salary: 0, phone: '+91 98765 43216', bank: 'Kotak Bank • XXXX-XXXX-6677', emergency: 'Spouse: +91 98765 66666', taxId: 'NARA5678L', blood: 'A+', address: 'No. 99, Cloud Avenue, Chennai' },
    { name: 'Mathanmk', email: 'mathanmk@ambizcon.com', role: 'Team Member', team: 'Development', salary: 0, phone: '+91 98765 43217', bank: 'ICICI Bank • XXXX-XXXX-4433', emergency: 'Brother: +91 98765 77777', taxId: 'MMK19012M', blood: 'B+', address: 'No. 12, AI Hub, Chennai' },
    { name: 'Mathi Pandian', email: 'mathi.p@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '+91 98765 43218', bank: 'Axis Bank • XXXX-XXXX-9900', emergency: 'Father: +91 98765 88888', taxId: 'MATH3456N', blood: 'O+', address: 'No. 7, Growth Lane, Chennai' },
    { name: 'Kiruthikashri M', email: 'kiruthikashri@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '+91 98765 43219', bank: 'SBI Bank • XXXX-XXXX-2233', emergency: 'Mother: +91 98765 99999', taxId: 'KRIT7890O', blood: 'A+', address: 'No. 45, Media Park, Chennai' },
    { name: 'Siddesh', email: 'siddesh@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '+91 98765 43220', bank: 'HDFC Bank • XXXX-XXXX-7788', emergency: 'Brother: +91 98765 10101', taxId: 'SIDD1234P', blood: 'AB+', address: 'No. 31, Ops Drive, Chennai' },
    { name: 'Sathish', email: 'sathish@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '+91 98765 43221', bank: 'Kotak Bank • XXXX-XXXX-5544', emergency: 'Father: +91 98765 20202', taxId: 'SATH5678Q', blood: 'O+', address: 'No. 67, Figma Square, Chennai' },
    { name: 'Kavish TG', email: 'kavish@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '+91 98765 43222', bank: 'ICICI Bank • XXXX-XXXX-1199', emergency: 'Spouse: +91 98765 30303', taxId: 'KAVI9012R', blood: 'B+', address: 'No. 19, Art Block, Chennai' },
    { name: 'Kasthuri', email: 'kasthuri@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '+91 98765 43223', bank: 'Axis Bank • XXXX-XXXX-8877', emergency: 'Mother: +91 98765 40404', taxId: 'KAST3456S', blood: 'A+', address: 'No. 52, Vector Way, Chennai' },
    { name: 'Ahamed', email: 'ahamed@ambizcon.com', role: 'Team Member', team: 'Creative', salary: 0, phone: '+91 98765 43224', bank: 'SBI Bank • XXXX-XXXX-3366', emergency: 'Brother: +91 98765 50505', taxId: 'AHAM7890T', blood: 'O+', address: 'No. 84, Brand Boulevard, Chennai' },
    { name: 'Adriana', email: 'adriana@ambizcon.com', role: 'Team Member', team: 'Marketing', salary: 0, phone: '+61 412 345 678', bank: 'Commonwealth Bank • XXXX-XXXX-4455', emergency: 'Spouse: +61 412 999 888', taxId: 'ADRI9012AU', blood: 'O+', address: 'Queen Street, Brisbane CBD, Australia' },
  ];

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

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `Ambizcon Health Financial Profit & Loss Statement — ${periodLabel}`,
        `Gross Revenue,$${grossRevenue}`,
        `Total Payroll Salaries,$${totalSalaries}`,
        `Operational Expenses,$${totalExpenses}`,
        `Reimbursement Claims Paid,$${totalClaims}`,
        `Net Profit,$${netProfit}`,
        `Profit Margin,${profitMargin}%`,
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ambizcon_Financial_Statement_${reportType}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported Financial Profit & Loss statement (${periodLabel}) to CSV!`);
    setIsReportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-[#086075]/15 via-[#2a8c82]/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl ambizcon-gradient text-white shadow-glow">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-extrabold tracking-tight text-foreground">
                Super Admin Finance & Claims Ledger
              </h1>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                Restricted Executive View
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Salary Payroll • Employee Personal Bank Details • Expenses • Profit & Loss
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            onClick={() => setIsEditMetricModalOpen(true)}
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold"
          >
            <Edit3 className="h-4 w-4" />
            Update Financial Metrics
          </Button>

          <Button onClick={() => setIsReportModalOpen(true)} size="sm" className="gap-1.5 ambizcon-gradient text-white shadow-glow">
            <Download className="h-4 w-4" />
            Download Full Roster & Payroll CSV
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
          <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-1">
            <ArrowUpRight className="h-3 w-3" /> +18.4% vs last mo
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
          <span className="text-[10px] text-muted-foreground mt-1 block">15 Roster Employees</span>
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

        {/* Reimbursement Claims */}
        <Card className="p-5 border border-zinc-200/80 dark:border-zinc-800/80 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Reimbursements Paid
            </span>
            <button
              onClick={() => setIsEditMetricModalOpen(true)}
              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              title="Edit Claims"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="text-2xl font-extrabold text-amber-500 mt-1 font-mono">
            ${totalClaims.toLocaleString()}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">Categorized Claims</span>
        </Card>

        {/* Net Profit */}
        <Card className="p-5 border border-emerald-500/30 bg-emerald-500/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Net Profit (Margin)
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            +${netProfit.toLocaleString()}
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
                <p className="text-[11px] text-muted-foreground">Approved employee claims grouped by category</p>
              </div>
            </div>
            <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 font-mono text-[10px]">
              ${totalClaims.toLocaleString()} Total
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
                    <span className="text-[10px] text-muted-foreground">{c.count} Claims Processed</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-extrabold font-mono text-foreground block">${c.amount.toLocaleString()}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {((c.amount / (totalClaims || 1)) * 100).toFixed(1)}% of claims
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
            <label className="text-xs font-semibold text-foreground">Reimbursements Paid ($)</label>
            <input
              type="number"
              value={editClaims}
              onChange={(e) => setEditClaims(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono focus-ring"
              required
            />
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
        description="Select report interval (Weekly, Monthly, Custom Range, Annual Full Year) to download complete personal & salary CSV."
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
              <option value="weekly font-semibold">Weekly Financial Summary</option>
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
