'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FestivalLeaveItem,
  FestivalBranchScope,
  FestivalCategory,
  EmployeeLeaveBalance,
  fetchFestivalLeaves,
  addFestivalLeave,
  updateFestivalLeave,
  deleteFestivalLeave,
  fetchEmployeeLeaveBalances,
  updateEmployeeLeaveBalance,
  bulkUpdateCommonLeavePolicy,
  getDayNameFromDate,
} from '@/lib/festival-leaves-store';
import { submitLeaveRequestAction, approveLeaveCEOAction, approveLeaveTLAction } from '@/actions/attendanceActions';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany } from '@/lib/company-filter';
import { SEED_USERS } from '@/lib/seed-data';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import {
  Calendar as CalendarIcon,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Building2,
  Users,
  Sliders,
  FileCheck,
  Search,
  Gift,
} from 'lucide-react';
import { toast } from 'sonner';

interface FestivalAndLeaveAdminPanelProps {
  usersList?: any[];
  onLeaveCreatedOrUpdated?: () => void;
}

export function FestivalAndLeaveAdminPanel({
  usersList = SEED_USERS,
  onLeaveCreatedOrUpdated,
}: FestivalAndLeaveAdminPanelProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);

  const roleLower = (currentUser?.role || '').toLowerCase().trim();
  const isSuperAdmin =
    roleLower === 'super admin' ||
    roleLower === 'admin' ||
    roleLower.includes('admin') ||
    currentUser?.email === 'anirudh@ambizcon.com' ||
    currentUser?.email === 'mathan@ambizcon.com';

  const isAustralia = isSuperAdmin
    ? selectedCompany === 'Ambizcon'
    : currentUser?.company === 'Ambizcon';

  const [festivalLeaves, setFestivalLeaves] = useState<FestivalLeaveItem[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<EmployeeLeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-view toggle for Admins: 'both' | 'festivals' | 'balances'
  const [sectionView, setSectionView] = useState<'both' | 'festivals' | 'balances'>('both');

  // Festival Branch Filter
  const [branchFilter, setBranchFilter] = useState<'All' | 'Ambizcon Health - India' | 'Ambizcon'>(() =>
    isAustralia ? 'Ambizcon' : 'Ambizcon Health - India'
  );

  useEffect(() => {
    setBranchFilter(isAustralia ? 'Ambizcon' : 'Ambizcon Health - India');
  }, [isAustralia]);

  // Add / Edit Festival Leave Modal State
  const [isFestivalModalOpen, setIsFestivalModalOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<FestivalLeaveItem | null>(null);
  const [festName, setFestName] = useState('');
  const [festDate, setFestDate] = useState('');
  const [festCategory, setFestCategory] = useState<FestivalCategory>('Festival Leave');
  const [festCompany, setFestCompany] = useState<FestivalBranchScope>('Ambizcon Health - India');
  const [festDescription, setFestDescription] = useState('');
  const [festIsPaid, setFestIsPaid] = useState(true);

  // Employee Leave Balance Filter & Edit Modal State
  const [empSearch, setEmpSearch] = useState('');
  const [empTeamFilter, setEmpTeamFilter] = useState<string>('All');
  const [editingBalance, setEditingBalance] = useState<EmployeeLeaveBalance | null>(null);
  const [casualTotal, setCasualTotal] = useState(12);
  const [casualUsed, setCasualUsed] = useState(0);
  const [sickTotal, setSickTotal] = useState(10);
  const [sickUsed, setSickUsed] = useState(0);
  const [earnedTotal, setEarnedTotal] = useState(15);
  const [earnedUsed, setEarnedUsed] = useState(0);
  const [permissionsUsed, setPermissionsUsed] = useState(0);

  // Quick Direct Leave Grant inside Employee Modal
  const [grantDirectLeave, setGrantDirectLeave] = useState(false);
  const [grantType, setGrantType] = useState<'Casual' | 'Sick' | 'Earned'>('Casual');
  const [grantFrom, setGrantFrom] = useState('');
  const [grantTo, setGrantTo] = useState('');
  const [grantDays, setGrantDays] = useState(1);
  const [grantReason, setGrantReason] = useState('Admin updated / sanctioned leave');

  // Bulk Policy Modal State
  const [isBulkPolicyModalOpen, setIsBulkPolicyModalOpen] = useState(false);
  const [bulkCasual, setBulkCasual] = useState(12);
  const [bulkSick, setBulkSick] = useState(10);
  const [bulkEarned, setBulkEarned] = useState(15);
  const [bulkBranchScope, setBulkBranchScope] = useState<'All' | 'Ambizcon Health - India' | 'Ambizcon'>('All');

  const loadAll = async () => {
    setLoading(true);
    const [fests, bals] = await Promise.all([
      fetchFestivalLeaves(),
      fetchEmployeeLeaveBalances(usersList.length > 0 ? usersList : SEED_USERS),
    ]);
    setFestivalLeaves(fests);
    setLeaveBalances(bals);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();

    const handleSync = () => {
      loadAll();
    };
    window.addEventListener('ambizcon_festival_leaves_updated', handleSync);
    window.addEventListener('ambizcon_leave_balances_updated', handleSync);
    return () => {
      window.removeEventListener('ambizcon_festival_leaves_updated', handleSync);
      window.removeEventListener('ambizcon_leave_balances_updated', handleSync);
    };
  }, [usersList.length]);

  // Filtered Festival Leaves
  const filteredFestivals = useMemo(() => {
    return festivalLeaves.filter((f) => {
      if (branchFilter === 'All') return true;
      return f.company === branchFilter || f.company === 'Both Branches';
    });
  }, [festivalLeaves, branchFilter]);

  const todayIso = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const upcomingFestivalsCount = useMemo(() => {
    return filteredFestivals.filter((f) => f.date >= todayIso).length;
  }, [filteredFestivals, todayIso]);

  // Filtered Employee Leave Balances
  const filteredBalances = useMemo(() => {
    return leaveBalances.filter((b) => {
      if (!isSuperAdmin && currentUser) {
        return b.user_email.toLowerCase() === currentUser.email.toLowerCase();
      }
      if (branchFilter !== 'All') {
        const userObj = (usersList.length > 0 ? usersList : SEED_USERS).find(
          (u) => u.email.toLowerCase() === b.user_email.toLowerCase()
        ) || { email: b.user_email, name: b.user_name, company: b.company, role: 'Team Member' };
        if (!isUserInCompany(userObj, branchFilter)) return false;
      }
      if (empTeamFilter !== 'All' && b.team !== empTeamFilter) return false;
      if (empSearch.trim()) {
        const q = empSearch.toLowerCase();
        return (
          b.user_name.toLowerCase().includes(q) ||
          b.user_email.toLowerCase().includes(q) ||
          b.team.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [leaveBalances, branchFilter, empTeamFilter, empSearch, isSuperAdmin, currentUser, usersList]);

  // Handlers for Festival Leaves
  const handleOpenAddFestival = () => {
    setEditingFestival(null);
    setFestName('');
    setFestDate(new Date().toLocaleDateString('en-CA'));
    setFestCategory('Festival Leave');
    setFestCompany(isAustralia ? 'Ambizcon' : 'Ambizcon Health - India');
    setFestDescription('');
    setFestIsPaid(true);
    setIsFestivalModalOpen(true);
  };

  const handleOpenEditFestival = (item: FestivalLeaveItem) => {
    setEditingFestival(item);
    setFestName(item.name);
    setFestDate(item.date);
    setFestCategory(item.category);
    setFestCompany(item.company);
    setFestDescription(item.description);
    setFestIsPaid(item.is_paid);
    setIsFestivalModalOpen(true);
  };

  const handleSaveFestival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!festName.trim() || !festDate) {
      toast.error('Please enter festival name and date');
      return;
    }

    if (editingFestival) {
      await updateFestivalLeave(editingFestival.id, {
        name: festName.trim(),
        date: festDate,
        day_name: getDayNameFromDate(festDate),
        category: festCategory,
        company: festCompany,
        description: festDescription.trim(),
        is_paid: festIsPaid,
      });
      toast.success(`Festival leave "${festName}" updated!`);
    } else {
      await addFestivalLeave({
        name: festName.trim(),
        date: festDate,
        category: festCategory,
        company: festCompany,
        description: festDescription.trim() || 'Common Festival Holiday',
        is_paid: festIsPaid,
      });
      toast.success(`Common festival leave "${festName}" added to calendar!`);
    }

    setIsFestivalModalOpen(false);
    await loadAll();
  };

  const handleDeleteFestival = async (item: FestivalLeaveItem) => {
    await deleteFestivalLeave(item.id);
    toast.success(`Removed "${item.name}" from festival leaves`);
    await loadAll();
  };

  // Handlers for Employee Leave Balance Update
  const handleOpenEditBalance = (bal: EmployeeLeaveBalance) => {
    setEditingBalance(bal);
    setCasualTotal(bal.casual_total);
    setCasualUsed(bal.casual_used);
    setSickTotal(bal.sick_total);
    setSickUsed(bal.sick_used);
    setEarnedTotal(bal.earned_total);
    setEarnedUsed(bal.earned_used);
    setPermissionsUsed(bal.permissions_used);
    setGrantDirectLeave(false);
    setGrantType('Casual');
    setGrantFrom(new Date().toLocaleDateString('en-CA'));
    setGrantTo(new Date().toLocaleDateString('en-CA'));
    setGrantDays(1);
    setGrantReason('Admin sanctioned leave update');
  };

  const handleSaveEmployeeBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalance) return;

    let nextCasualUsed = Number(casualUsed);
    let nextSickUsed = Number(sickUsed);
    let nextEarnedUsed = Number(earnedUsed);

    if (grantDirectLeave && grantFrom) {
      const daysNum = Math.max(0.5, Number(grantDays) || 1);
      if (grantType === 'Casual') nextCasualUsed += daysNum;
      if (grantType === 'Sick') nextSickUsed += daysNum;
      if (grantType === 'Earned') nextEarnedUsed += daysNum;

      // Also create an approved leave request in Supabase leave_requests
      try {
        const userObj = (usersList.length > 0 ? usersList : SEED_USERS).find(
          (u) => u.email.toLowerCase() === editingBalance.user_email.toLowerCase()
        );
        const createdReq = await submitLeaveRequestAction({
          empId: userObj?._id || editingBalance.user_email,
          empName: editingBalance.user_name,
          empTeam: editingBalance.team as any,
          type: grantType,
          from: grantFrom,
          to: grantTo || grantFrom,
          days: daysNum,
          reason: grantReason || 'Sanctioned by Admin',
        });
        if (createdReq?.id) {
          await approveLeaveTLAction(createdReq.id);
          await approveLeaveCEOAction(createdReq.id);
        }
      } catch (err) {}
    }

    await updateEmployeeLeaveBalance({
      ...editingBalance,
      casual_total: Number(casualTotal),
      casual_used: nextCasualUsed,
      sick_total: Number(sickTotal),
      sick_used: nextSickUsed,
      earned_total: Number(earnedTotal),
      earned_used: nextEarnedUsed,
      permissions_used: Number(permissionsUsed),
    });

    toast.success(`Updated leave balance for ${editingBalance.user_name}!`);
    setEditingBalance(null);
    await loadAll();
    if (onLeaveCreatedOrUpdated) {
      onLeaveCreatedOrUpdated();
    }
  };

  const handleSaveBulkPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    await bulkUpdateCommonLeavePolicy(
      Number(bulkCasual),
      Number(bulkSick),
      Number(bulkEarned),
      bulkBranchScope,
      usersList.length > 0 ? usersList : SEED_USERS
    );
    toast.success('Common annual leave policy updated across employees!');
    setIsBulkPolicyModalOpen(false);
    await loadAll();
  };

  const formatReadableDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold tracking-tight text-foreground">
                Common Festival Leaves & {isSuperAdmin ? 'Admin Leave Update Console' : 'My Leave Balances'}
              </h2>
              <Badge className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">
                100% SUPABASE SYNCED
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSuperAdmin
                ? 'Manage official Common Festival Leaves (India & Australia), update employee leave balances, and grant/sanction leaves directly.'
                : 'Official company festival holidays calendar and your real-time sanctioned leave balance.'}
            </p>
          </div>
        </div>

        {/* Filter & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Selector */}
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value as any)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-bold focus-ring"
          >
            <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India</option>
            <option value="Ambizcon">🇦🇺 Ambizcon (Australia)</option>
            <option value="All">🌐 All Branches (India + Australia)</option>
          </select>

          {isSuperAdmin && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsBulkPolicyModalOpen(true)}
                className="gap-1.5 text-xs font-bold border-brand-500/40 text-brand-600 dark:text-brand-400"
              >
                <Sliders className="h-3.5 w-3.5" />
                Update Common Leave Quota
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddFestival}
                className="gap-1.5 text-xs font-extrabold ambizcon-gradient text-white shadow-glow"
              >
                <Plus className="h-4 w-4" />
                + Add Festival Leave
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Sub-View Pill Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900/80 p-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
          <button
            type="button"
            onClick={() => setSectionView('both')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sectionView === 'both'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Show All
          </button>
          <button
            type="button"
            onClick={() => setSectionView('festivals')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sectionView === 'festivals'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🎉 Common Festival Leaves ({filteredFestivals.length})
          </button>
          <button
            type="button"
            onClick={() => setSectionView('balances')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              sectionView === 'balances'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            📋 {isSuperAdmin ? `Employee Leave Update (${filteredBalances.length})` : 'My Leave Balance'}
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline" className="font-mono text-[11px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
            {filteredFestivals.length} Total Festival Holidays • {upcomingFestivalsCount} Upcoming
          </Badge>
        </div>
      </div>

      {/* SECTION 1: COMMON FESTIVAL LEAVES CALENDAR */}
      {(sectionView === 'both' || sectionView === 'festivals') && (
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <h3 className="text-base font-extrabold text-foreground">
                  Common Festival Leaves & Public Holidays Calendar (2026)
                </h3>
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                  SANCTIONED PAID HOLIDAYS
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Common company-wide festival holidays for {branchFilter === 'All' ? 'India & Australia' : branchFilter}.
              </p>
            </div>

            {isSuperAdmin && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenAddFestival}
                variant="outline"
                className="gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Festival Leave
              </Button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-muted-foreground font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">DATE & DAY</th>
                  <th className="px-4 py-3">FESTIVAL / HOLIDAY NAME</th>
                  <th className="px-4 py-3">CATEGORY</th>
                  <th className="px-4 py-3">BRANCH SCOPE</th>
                  <th className="px-4 py-3">PAY STATUS</th>
                  {isSuperAdmin && <th className="px-4 py-3 text-right">ADMIN ACTIONS</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                {filteredFestivals.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-4 py-8 text-center text-muted-foreground">
                      No festival leaves found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredFestivals.map((fest) => {
                    const isUpcoming = fest.date >= todayIso;
                    return (
                      <tr
                        key={fest.id}
                        className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors ${
                          isUpcoming ? '' : 'opacity-70'
                        }`}
                      >
                        <td className="px-4 py-3 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-foreground text-xs">
                              {formatReadableDate(fest.date)}
                            </span>
                            {isUpcoming && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-sans font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                Upcoming
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-muted-foreground block">{fest.day_name}</span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="font-bold text-foreground block text-xs">{fest.name}</span>
                          {fest.description && (
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {fest.description}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            className={
                              fest.category === 'Festival Leave'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px]'
                                : fest.category === 'National Holiday'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[10px]'
                                : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px]'
                            }
                          >
                            {fest.category}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {fest.company === 'Both Branches'
                              ? '🌐 India & Australia'
                              : fest.company === 'Ambizcon'
                              ? '🇦🇺 Australia (Ambizcon)'
                              : '🇮🇳 India (Ambizcon Health)'}
                          </Badge>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {fest.is_paid ? '100% Paid Leave' : 'Optional Leave'}
                          </span>
                        </td>

                        {isSuperAdmin && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditFestival(fest)}
                                className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 h-7 px-2"
                                title="Edit Festival Leave"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFestival(fest)}
                                className="text-rose-500 hover:bg-rose-500/10 h-7 px-2"
                                title="Remove Festival Leave"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* SECTION 2: ADMIN EMPLOYEE LEAVE BALANCE & LEAVE UPDATE TABLE */}
      {(sectionView === 'both' || sectionView === 'balances') && (
        <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-base font-extrabold text-foreground">
                  {isSuperAdmin
                    ? 'Admin Employee Leave Quota & Leave Status Update'
                    : 'My Annual Leave Quota & Remaining Balance'}
                </h3>
                <Badge className="bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30 text-[10px] font-bold">
                  {isSuperAdmin ? 'ADMIN LEAVE CONTROL' : 'PERSONAL LEDGER'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isSuperAdmin
                  ? 'Click "Update Leave" on any team member to adjust their Casual, Sick, or Earned leave balance or directly record a sanctioned leave.'
                  : 'Overview of your Casual, Sick, and Earned leave entitlement and remaining days.'}
              </p>
            </div>

            {isSuperAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={empSearch}
                    onChange={(e) => setEmpSearch(e.target.value)}
                    placeholder="Search employee..."
                    className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background py-1.5 pl-8 pr-3 text-xs focus-ring"
                  />
                </div>

                <select
                  value={empTeamFilter}
                  onChange={(e) => setEmpTeamFilter(e.target.value)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
                >
                  <option value="All">All Teams</option>
                  <option value="Development">Development</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Creative">Creative</option>
                </select>
              </div>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/60 text-muted-foreground font-semibold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">EMPLOYEE</th>
                  <th className="px-4 py-3">TEAM & BRANCH</th>
                  <th className="px-4 py-3 text-center">CASUAL LEAVE</th>
                  <th className="px-4 py-3 text-center">SICK LEAVE</th>
                  <th className="px-4 py-3 text-center">EARNED LEAVE</th>
                  <th className="px-4 py-3 text-center">PERMISSIONS</th>
                  <th className="px-4 py-3 text-center">TOTAL REMAINING</th>
                  {isSuperAdmin && <th className="px-4 py-3 text-right">LEAVE UPDATE</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/70 dark:divide-zinc-800/70">
                {filteredBalances.map((bal) => {
                  const casualRem = Math.max(0, bal.casual_total - bal.casual_used);
                  const sickRem = Math.max(0, bal.sick_total - bal.sick_used);
                  const earnedRem = Math.max(0, bal.earned_total - bal.earned_used);
                  const totalRem = casualRem + sickRem + earnedRem;

                  return (
                    <tr key={bal.user_email} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={bal.user_name} size="sm" />
                          <div>
                            <span className="font-bold text-foreground block text-xs">{bal.user_name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{bal.user_email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-semibold text-foreground block">{bal.team}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {bal.company === 'Ambizcon' ? '🇦🇺 Australia' : '🇮🇳 India'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                          {casualRem} Left
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Used: {bal.casual_used} / {bal.casual_total}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-extrabold text-blue-600 dark:text-blue-400">
                          {sickRem} Left
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Used: {bal.sick_used} / {bal.sick_total}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-extrabold text-purple-600 dark:text-purple-400">
                          {earnedRem} Left
                        </span>
                        <span className="text-[10px] text-muted-foreground block">
                          Used: {bal.earned_used} / {bal.earned_total}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center font-mono">
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {bal.permissions_used} / 3
                        </span>
                        <span className="text-[10px] text-muted-foreground block">Monthly</span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-mono font-extrabold text-xs">
                          {totalRem} Days Available
                        </Badge>
                      </td>

                      {isSuperAdmin && (
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditBalance(bal)}
                            className="gap-1.5 text-xs font-bold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Update Leave
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: ADD / EDIT COMMON FESTIVAL LEAVE */}
      <Modal
        isOpen={isFestivalModalOpen}
        onClose={() => setIsFestivalModalOpen(false)}
        title={editingFestival ? `Edit Festival Leave • ${editingFestival.name}` : 'Add Common Festival Leave'}
        description="Configure company-wide festival holidays for India, Australia, or Both Branches."
        maxWidth="md"
      >
        <form onSubmit={handleSaveFestival} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Festival / Holiday Name *</label>
            <input
              type="text"
              value={festName}
              onChange={(e) => setFestName(e.target.value)}
              placeholder="e.g. Deepavali / Diwali, Pongal, Australia Day..."
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Holiday Date *</label>
              <input
                type="date"
                value={festDate}
                onChange={(e) => setFestDate(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Category</label>
              <select
                value={festCategory}
                onChange={(e) => setFestCategory(e.target.value as FestivalCategory)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Festival Leave">Festival Leave</option>
                <option value="National Holiday">National Holiday</option>
                <option value="Regional / State Holiday">Regional / State Holiday</option>
                <option value="Optional Holiday">Optional Holiday</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Company Branch Scope *</label>
            <select
              value={festCompany}
              onChange={(e) => setFestCompany(e.target.value as FestivalBranchScope)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India (Chennai HQ)</option>
              <option value="Ambizcon">🇦🇺 Ambizcon (Australia - Brisbane HQ)</option>
              <option value="Both Branches">🌐 Both Branches (India & Australia)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Description / Notes</label>
            <input
              type="text"
              value={festDescription}
              onChange={(e) => setFestDescription(e.target.value)}
              placeholder="e.g. Statutory paid festival holiday for all teams"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="festIsPaid"
              checked={festIsPaid}
              onChange={(e) => setFestIsPaid(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="festIsPaid" className="text-xs font-semibold text-foreground cursor-pointer">
              100% Paid Sanctioned Company Holiday
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsFestivalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
              {editingFestival ? 'Update Festival Leave' : 'Save Festival Leave'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: ADMIN UPDATE INDIVIDUAL EMPLOYEE LEAVE BALANCE / GRANT LEAVE */}
      <Modal
        isOpen={!!editingBalance}
        onClose={() => setEditingBalance(null)}
        title={`Update Leave & Balance • ${editingBalance?.user_name || ''}`}
        description="Adjust Casual, Sick, and Earned leave quotas/used days or directly record a sanctioned leave."
        maxWidth="lg"
      >
        {editingBalance && (
          <form onSubmit={handleSaveEmployeeBalance} className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              {/* Casual Leave */}
              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400 block">
                  Casual Leave
                </span>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Used Days</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={casualUsed}
                    onChange={(e) => setCasualUsed(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Total Quota</label>
                  <input
                    type="number"
                    min="0"
                    value={casualTotal}
                    onChange={(e) => setCasualTotal(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Sick Leave */}
              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-blue-600 dark:text-blue-400 block">
                  Sick Leave
                </span>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Used Days</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={sickUsed}
                    onChange={(e) => setSickUsed(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Total Quota</label>
                  <input
                    type="number"
                    min="0"
                    value={sickTotal}
                    onChange={(e) => setSickTotal(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Earned Leave */}
              <div className="p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/50 space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-purple-600 dark:text-purple-400 block">
                  Earned Leave
                </span>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Used Days</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={earnedUsed}
                    onChange={(e) => setEarnedUsed(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground">Total Quota</label>
                  <input
                    type="number"
                    min="0"
                    value={earnedTotal}
                    onChange={(e) => setEarnedTotal(Number(e.target.value))}
                    className="mt-0.5 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Monthly Permissions Used */}
            <div className="flex items-center justify-between p-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/40">
              <div>
                <span className="text-xs font-bold text-foreground block">Monthly Short Permissions Taken</span>
                <span className="text-[11px] text-muted-foreground">Max 3 permissions allowed per month</span>
              </div>
              <input
                type="number"
                min="0"
                max="10"
                value={permissionsUsed}
                onChange={(e) => setPermissionsUsed(Number(e.target.value))}
                className="w-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-mono font-bold text-center"
              />
            </div>

            {/* Optional: Direct Grant / Record New Sanctioned Leave */}
            <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="grantDirectLeave"
                  checked={grantDirectLeave}
                  onChange={(e) => setGrantDirectLeave(e.target.checked)}
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600"
                />
                <label htmlFor="grantDirectLeave" className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 cursor-pointer">
                  + Also Record & Grant a New Sanctioned Leave Entry for {editingBalance.user_name}
                </label>
              </div>

              {grantDirectLeave && (
                <div className="space-y-3 pt-2 border-t border-emerald-500/20">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground">Leave Type</label>
                      <select
                        value={grantType}
                        onChange={(e) => setGrantType(e.target.value as any)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1.5 text-xs font-bold"
                      >
                        <option value="Casual">Casual</option>
                        <option value="Sick">Sick</option>
                        <option value="Earned">Earned</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground">From Date</label>
                      <input
                        type="date"
                        value={grantFrom}
                        onChange={(e) => {
                          setGrantFrom(e.target.value);
                          if (!grantTo || grantTo < e.target.value) setGrantTo(e.target.value);
                        }}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground">To Date</label>
                      <input
                        type="date"
                        value={grantTo}
                        onChange={(e) => setGrantTo(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1.5 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-muted-foreground">Days</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        value={grantDays}
                        onChange={(e) => setGrantDays(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1.5 text-xs font-mono font-bold"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-muted-foreground">Sanction Note / Reason</label>
                    <input
                      type="text"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setEditingBalance(null)}>
                Cancel
              </Button>
              <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
                Save Leave Update
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL 3: BULK UPDATE COMMON LEAVE POLICY */}
      <Modal
        isOpen={isBulkPolicyModalOpen}
        onClose={() => setIsBulkPolicyModalOpen(false)}
        title="Update Common Annual Leave Quota Policy"
        description="Set the standard annual Casual, Sick, and Earned leave entitlement across employees."
        maxWidth="md"
      >
        <form onSubmit={handleSaveBulkPolicy} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Apply Policy To Branch</label>
            <select
              value={bulkBranchScope}
              onChange={(e) => setBulkBranchScope(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring font-semibold"
            >
              <option value="All">🌐 All Employees (India & Australia)</option>
              <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India Only</option>
              <option value="Ambizcon">🇦🇺 Ambizcon (Australia) Only</option>
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Casual Leaves / Yr</label>
              <input
                type="number"
                min="0"
                value={bulkCasual}
                onChange={(e) => setBulkCasual(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Sick Leaves / Yr</label>
              <input
                type="number"
                min="0"
                value={bulkSick}
                onChange={(e) => setBulkSick(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground">Earned Leaves / Yr</label>
              <input
                type="number"
                min="0"
                value={bulkEarned}
                onChange={(e) => setBulkEarned(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm font-mono font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <Button type="button" variant="outline" onClick={() => setIsBulkPolicyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
              Apply Common Leave Quota
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
