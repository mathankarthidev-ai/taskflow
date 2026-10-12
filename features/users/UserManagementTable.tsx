'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { User, UserRole, TeamName, WorkMode, CompanyBranch } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import {
  fetchAllUsersAction,
  updateUserRoleAction,
  updateUserAction,
  createUserAction,
  deleteUserAction,
} from '@/actions/userActions';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { Users, UserPlus, Trash2, Search, Edit3, DollarSign, Building2, UserCheck, ShieldCheck, CheckCircle2, Plus, Sparkles, FolderPlus, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany, resolveEffectiveCompany } from '@/lib/company-filter';
import { CompletedPeriod } from '@/lib/completed-tasks-generator';
import { CompletedTasksExplorerModal } from '@/components/tasks/CompletedTasksExplorerModal';
import { FestivalAndLeaveAdminPanel } from '@/components/attendance/FestivalAndLeaveAdminPanel';

// Format date of birth to strictly Date and Month only (No year)
export function formatDayMonthOnly(val?: string): string {
  if (!val) return '—';
  let s = val.replace(/\s*\(\d{4}\)/g, '').trim();
  const parts = s.split(/[\/\-\.]/);
  if (parts.length === 3 && parts[2].length === 4) {
    const day = parts[0].padStart(2, '0');
    const monthNum = parseInt(parts[1], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${day} ${months[monthNum - 1]}`;
    }
    return `${parts[0]}/${parts[1]}`;
  }
  return s.replace(/\s+\d{4}$/, '').trim();
}

export function UserManagementTable() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Edit Member Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('Team Member');
  const [editTeam, setEditTeam] = useState<TeamName>('Development');
  const [editCompany, setEditCompany] = useState<CompanyBranch>('Ambizcon Health - India');
  const [editBirthday, setEditBirthday] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editWorkMode, setEditWorkMode] = useState<WorkMode>('Work From Office');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<TeamName | 'All'>('All');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<CompanyBranch | 'All'>(selectedCompany || 'All');
  const [activeTab, setActiveTab] = useState<'directory' | 'approvals' | 'leaves'>('directory');

  // Completed Tasks Explorer Modal State
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [completedModalMemberId, setCompletedModalMemberId] = useState<string>('all');
  const [completedModalPeriod, setCompletedModalPeriod] = useState<CompletedPeriod>('daily');

  useEffect(() => {
    if (selectedCompany) {
      setSelectedCompanyFilter(selectedCompany);
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#approvals') setActiveTab('approvals');
      if (window.location.hash === '#leaves') setActiveTab('leaves');
    }
  }, []);

  // Teams List State
  const [teamsList, setTeamsList] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_teams_list');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {}
      }
    }
    return ['Creative', 'Marketing', 'Development'];
  });

  // Add Team Modal State
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newTeamNameInput, setNewTeamNameInput] = useState('');
  const [newTeamDescInput, setNewTeamDescInput] = useState('');

  // Users scoped to the currently selected company branch filter
  const companyScopedUsers = useMemo(() => {
    if (selectedCompanyFilter === 'All') return users;
    return users.filter((u) => isUserInCompany(u, selectedCompanyFilter));
  }, [users, selectedCompanyFilter]);

  // Calculate team headcount for active branch
  const teamCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    teamsList.forEach((t) => (counts[t] = 0));
    companyScopedUsers.forEach((u) => {
      const t = u.team || 'Development';
      counts[t] = (counts[t] || 0) + 1;
    });
    return counts;
  }, [companyScopedUsers, teamsList]);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTeamNameInput.trim();
    if (!trimmed) {
      toast.error('Please enter a team name');
      return;
    }
    if (teamsList.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      toast.error(`Team "${trimmed}" already exists!`);
      return;
    }
    const updated = [...teamsList, trimmed];
    setTeamsList(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskflow_teams_list', JSON.stringify(updated));
    }
    setNewTeam(trimmed);
    setNewTeamNameInput('');
    setNewTeamDescInput('');
    setIsAddTeamModalOpen(false);
    toast.success(`Team "${trimmed}" added to workspace!`, {
      description: 'You can now assign members and filter by this team.',
    });
  };

  useEffect(() => {
    if (selectedCompany) {
      setSelectedCompanyFilter(selectedCompany);
    }
  }, [selectedCompany]);


  // Add Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newBirthday, setNewBirthday] = useState('');
  const [newWorkMode, setNewWorkMode] = useState<WorkMode>('Work From Office');
  const [newRole, setNewRole] = useState<UserRole>('Team Member');
  const [newTeam, setNewTeam] = useState<TeamName>('Development');
  const [newCompany, setNewCompany] = useState<CompanyBranch>('Ambizcon Health - India');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await fetchAllUsersAction();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (!currentUser) return null;

  if (currentUser.role !== 'Super Admin') {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Access Restricted: Super Admin privilege required to manage company workspace users.
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error('Please enter user name and email');
      return;
    }

    if (!newEmail.toLowerCase().endsWith('@ambizcon.com')) {
      toast.error('Email must end with @ambizcon.com');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createUserAction({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        role: newRole,
        team: newTeam,
        company: newCompany,
        dob: newDob.trim() || '14 Oct',
        birthday: newBirthday.trim() || newDob.trim() || '14 Oct',
        workMode: newWorkMode,
      });

      setUsers([created, ...users]);
      toast.success(`User ${created.name} added successfully to ${newCompany}!`);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewDob('');
      setNewBirthday('');
      setNewWorkMode('Work From Office');
    } catch (e) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditTeam(u.team);
    setEditCompany(u.company || 'Ambizcon Health - India');
    setEditBirthday(formatDayMonthOnly(u.birthday || u.dob || '14 Oct'));
    setEditDob(formatDayMonthOnly(u.dob || u.birthday || '14 Oct'));
    setEditWorkMode(u.workMode || 'Work From Office');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updatedUser = await updateUserAction(editingUser._id, {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
        team: editTeam,
        company: editCompany,
        birthday: editBirthday,
        dob: editDob,
        workMode: editWorkMode,
      });

      const updated = users.map((u) => {
        if (u._id === editingUser._id) {
          return updatedUser || {
            ...u,
            name: editName.trim(),
            email: editEmail.trim().toLowerCase(),
            role: editRole,
            team: editTeam,
            company: editCompany,
            birthday: editBirthday,
            dob: editDob,
            workMode: editWorkMode,
          };
        }
        return u;
      });

      setUsers(updated);

      if (currentUser && editingUser._id === currentUser._id) {
        const saved = updatedUser || {
          ...currentUser,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          role: editRole,
          team: editTeam,
          company: editCompany,
          birthday: editBirthday,
          dob: editDob,
          workMode: editWorkMode,
        };
        useAuthStore.getState().setCurrentUser(saved);
        if (typeof window !== 'undefined') {
          localStorage.setItem('taskflow_user_email', saved.email);
          document.cookie = `taskflow_user=${encodeURIComponent(JSON.stringify(saved))}; path=/; max-age=864000`;
        }
      }

      toast.success(`Employee ${editName} details saved and updated successfully!`);
      setEditingUser(null);
    } catch (err) {
      toast.error('Failed to update employee details');
    }
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const updated = await updateUserRoleAction(userId, role);
    if (updated) {
      setUsers(users.map((u) => (u._id === userId ? updated : u)));
      toast.success(`Role updated to ${role}`);
    }
  };

  const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteUser = (userId: string, userName: string) => {
    if (userId === currentUser._id) {
      toast.error('You cannot delete your own logged-in Super Admin account');
      return;
    }
    setUserToDelete({ id: userId, name: userName });
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    const { id, name } = userToDelete;
    const success = await deleteUserAction(id);
    if (success) {
      setUsers(users.filter((u) => u._id !== id));
      toast.success(`User ${name} removed.`);
    }
    setUserToDelete(null);
  };

  const filteredUsers = users.filter((u) => {
    if (selectedTeamFilter !== 'All' && u.team !== selectedTeamFilter) return false;
    if (selectedCompanyFilter !== 'All') {
      if (!isUserInCompany(u, selectedCompanyFilter)) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.company && u.company.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">User Details & Member CRUD Console</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Super Admin control panel to edit individual employee details, update roles, and manage team assignments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveTab('leaves')}
            className="gap-1.5 text-xs border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/20"
          >
            <CalendarIcon className="h-4 w-4" />
            Leave Update & Festival Leaves
          </Button>

          <Link href="/finance">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              <DollarSign className="h-4 w-4" />
              Finance & Payroll Ledger
            </Button>
          </Link>

          <Button onClick={() => setIsAddTeamModalOpen(true)} size="sm" variant="outline" className="gap-1.5 text-xs border-brand-500/40 text-brand-600 dark:text-brand-400 font-bold">
            <FolderPlus className="h-4 w-4" />
            Add New Team
          </Button>

          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5 ambizcon-gradient text-white shadow-glow">
            <UserPlus className="h-4 w-4" />
            Add New Member
          </Button>
        </div>
      </div>

      {/* Interactive Tab Switcher: User Directory vs Role Approvals vs Leave Update & Festival Leaves */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'directory'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
          }`}
        >
          <Users className="h-4 w-4" />
          User Directory ({users.length} Members)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'approvals'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
              : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
          }`}
        >
          <ShieldCheck className="h-4 w-4" />
          Role Approvals & Sign-offs
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'leaves'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-muted-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800/80 hover:text-foreground'
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Leave Update & Common Festival Leaves
        </button>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Teams Overview & Member Headcount Card Grid */}
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                  Workspace Teams & Member Headcount ({teamsList.length} Teams)
                </h3>
              </div>
              <Button
                type="button"
                onClick={() => setIsAddTeamModalOpen(true)}
                size="sm"
                variant="outline"
                className="text-[11px] font-bold py-1 px-2.5 h-7 border-brand-500/40 text-brand-600 dark:text-brand-400 gap-1"
              >
                <Plus className="h-3 w-3" /> Add Team
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {teamsList.map((teamName) => {
                const count = teamCounts[teamName] || 0;
                const isSelected = selectedTeamFilter === teamName;
                const teamUsers = companyScopedUsers.filter((u) => u.team === teamName);

                return (
                  <div
                    key={teamName}
                    onClick={() => setSelectedTeamFilter(isSelected ? 'All' : (teamName as any))}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 group ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/30 shadow-xs'
                        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-brand-500/50 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-foreground truncate">{teamName}</span>
                      <Badge
                        variant={isSelected ? 'default' : 'outline'}
                        className="text-[10px] font-mono px-1.5 py-0 font-bold"
                      >
                        {count} {count === 1 ? 'member' : 'members'}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-zinc-200/40 dark:border-zinc-800/40">
                      <span className="text-[10px]">
                        {isSelected ? '✓ Filtered' : 'Click to filter'}
                      </span>
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {teamUsers.slice(0, 3).map((tu) => (
                          <Avatar key={tu._id} src={tu.avatar} name={tu.name} size="sm" className="border border-background h-5 w-5 text-[9px]" />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Quick Card: Add New Team */}
              <div
                onClick={() => setIsAddTeamModalOpen(true)}
                className="p-3 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/30 dark:bg-zinc-900/20 hover:border-brand-500/60 hover:bg-brand-500/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-1 group"
              >
                <div className="h-7 w-7 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-foreground">+ Add New Team</span>
                <span className="text-[10px] text-muted-foreground">Create custom squad</span>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-4 glass-card">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members by name or email..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background py-1.5 pl-9 pr-3 text-xs focus-ring"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedCompanyFilter}
            onChange={(e) => setSelectedCompanyFilter(e.target.value as CompanyBranch | 'All')}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
          >
            <option value="All">All Companies / Branches</option>
            <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India</option>
            <option value="Ambizcon">🇦🇺 Ambizcon</option>
          </select>

          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value as TeamName | 'All')}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs font-semibold focus-ring"
          >
            <option value="All">All Workspace Teams ({companyScopedUsers.length} members)</option>
            {teamsList.map((t) => (
              <option key={t} value={t}>
                {t} Team ({teamCounts[t] || 0} {teamCounts[t] === 1 ? 'member' : 'members'})
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCompletedModalMemberId('all');
              setCompletedModalPeriod('daily');
              setIsCompletedModalOpen(true);
            }}
            className="gap-1.5 text-xs font-bold border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Completed Tasks View (5D • 10W • 40M • 100+Y)
          </Button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <Skeleton className="h-80 w-full rounded-2xl" />
      ) : (
        <Card className="overflow-hidden border border-zinc-200/80 dark:border-zinc-800/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/50 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Company Branch</th>
                  <th className="px-4 py-3">Authorized Email</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Completed Tasks (Click to View)</th>
                  <th className="px-4 py-3">Birthday / DOB</th>
                  <th className="px-4 py-3">Work Mode</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:border-zinc-800/60">
                {filteredUsers.map((u) => {
                  const effCompany = resolveEffectiveCompany(u);
                  return (
                  <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <span className="font-semibold text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-semibold whitespace-nowrap">
                        {effCompany === 'India & Australia'
                          ? '🌐 India & Australia'
                          : effCompany === 'Ambizcon'
                          ? '🇦🇺 Australia'
                          : '🇮🇳 India'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3 font-medium">{u.team}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={u.role === 'Super Admin' ? 'danger' : u.role === 'Team Lead' ? 'warning' : 'outline'}
                        className="text-[10px]"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedModalMemberId(u._id);
                            setCompletedModalPeriod('daily');
                            setIsCompletedModalOpen(true);
                          }}
                          className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
                          title={`View ${u.name}'s 5 Daily completed tasks`}
                        >
                          5D
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedModalMemberId(u._id);
                            setCompletedModalPeriod('weekly');
                            setIsCompletedModalOpen(true);
                          }}
                          className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-blue-600 dark:text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"
                          title={`View ${u.name}'s 10 Weekly completed tasks`}
                        >
                          10W
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedModalMemberId(u._id);
                            setCompletedModalPeriod('monthly');
                            setIsCompletedModalOpen(true);
                          }}
                          className="rounded-md border border-purple-500/30 bg-purple-500/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white transition-colors"
                          title={`View ${u.name}'s 40 Monthly completed tasks`}
                        >
                          40M
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCompletedModalMemberId(u._id);
                            setCompletedModalPeriod('yearly');
                            setIsCompletedModalOpen(true);
                          }}
                          className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold font-mono text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white transition-colors"
                          title={`View ${u.name}'s 105 (100+) Yearly completed tasks`}
                        >
                          100+Y
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold">{formatDayMonthOnly(u.dob || u.birthday || '14 Oct')}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {u.workMode || 'Work From Office'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEditModal(u)}
                          className="text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          title="Edit Employee Details"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="text-rose-500 hover:bg-rose-500/10"
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
        </>
      ) : activeTab === 'leaves' ? (
        <FestivalAndLeaveAdminPanel usersList={users} />
      ) : (
        /* Role Approvals & Security Governance Panel */
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-800/60 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Role Approval Queue & Access Controls
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Super Admin sign-off for role elevation, team lead promotions, and workspace security management.
                </p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                Security Enforced
              </Badge>
            </div>

            {/* Role Change Matrix */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Workspace Member Access Matrix & Role Sign-offs
              </h4>
              <div className="space-y-2">
                {companyScopedUsers.map((u) => (
                  <div
                    key={u._id}
                    className="flex flex-wrap items-center justify-between p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/50 dark:bg-zinc-900/40 text-xs gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar} name={u.name} size="sm" />
                      <div>
                        <span className="font-bold text-foreground block">{u.name}</span>
                        <span className="text-[10px] text-muted-foreground">{u.email} · {u.team} Team</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground font-medium">Elevate / Update Role:</span>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1 text-xs font-bold focus-ring"
                      >
                        <option value="Team Member">Team Member</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Super Admin">Super Admin</option>
                        <option value="Reception Staff">Reception Staff</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Individual Member Details Modal */}
      {editingUser && (
        <Modal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          title={`Edit Details • ${editingUser.name}`}
          description="Update individual employee details, role, team, birthday, and work mode."
          maxWidth="lg"
        >
          <form onSubmit={handleSaveEditUser} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground">Full Name *</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Work Email (@ambizcon.com) *</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Company / Branch *</label>
              <select
                value={editCompany}
                onChange={(e) => setEditCompany(e.target.value as CompanyBranch)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India (Chennai HQ)</option>
                <option value="Ambizcon">🇦🇺 Ambizcon (Brisbane HQ)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Assigned Team</label>
                <select
                  value={editTeam}
                  onChange={(e) => setEditTeam(e.target.value as TeamName)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                >
                  {teamsList.map((t) => (
                    <option key={t} value={t}>
                      {t} Team ({teamCounts[t] || 0} {teamCounts[t] === 1 ? 'member' : 'members'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Access Role</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                >
                  <option value="Team Member">Team Member</option>
                  <option value="Team Lead">Team Lead</option>
                  <option value="Super Admin">Super Admin</option>
                  <option value="Reception Staff">Reception Staff</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground">Date of Birth (Day & Month only) *</label>
                <input
                  type="text"
                  value={editDob}
                  onChange={(e) => setEditDob(e.target.value)}
                  placeholder="e.g. 29 Jun or 14 Oct"
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Birthday (Calendar Day)</label>
                <input
                  type="text"
                  value={editBirthday}
                  onChange={(e) => setEditBirthday(e.target.value)}
                  placeholder="e.g. 14 Oct"
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Default Work Mode</label>
                <select
                  value={editWorkMode}
                  onChange={(e) => setEditWorkMode(e.target.value as WorkMode)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
                >
                  <option value="Work From Office">Work From Office</option>
                  <option value="Work From Home">Work From Home</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
                Save Employee Details
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add New Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Workspace Member"
        description="Create a new team member persona with authorized @ambizcon.com credentials."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Full Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Company / Branch *</label>
            <select
              value={newCompany}
              onChange={(e) => setNewCompany(e.target.value as CompanyBranch)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India (Chennai HQ)</option>
              <option value="Ambizcon">🇦🇺 Ambizcon (Brisbane HQ)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Company Email (@ambizcon.com) *</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="sarah@ambizcon.com"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Assigned Team</label>
                <button
                  type="button"
                  onClick={() => setIsAddTeamModalOpen(true)}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Add Team
                </button>
              </div>
              <select
                value={newTeam}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setIsAddTeamModalOpen(true);
                  } else {
                    setNewTeam(e.target.value as TeamName);
                  }
                }}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                {teamsList.map((t) => (
                  <option key={t} value={t}>
                    {t} Team ({teamCounts[t] || 0} {teamCounts[t] === 1 ? 'member' : 'members'})
                  </option>
                ))}
                <option value="__add_new__">+ Create New Team...</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Access Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Team Member">Team Member</option>
                <option value="Team Lead">Team Lead</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Reception Staff">Reception Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Date of Birth (Day & Month only) *</label>
              <input
                type="text"
                value={newDob}
                onChange={(e) => setNewDob(e.target.value)}
                placeholder="e.g. 29 Jun or 14 Oct"
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Birthday (Calendar Day)</label>
              <input
                type="text"
                value={newBirthday}
                onChange={(e) => setNewBirthday(e.target.value)}
                placeholder="e.g. 14 Oct"
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Default Work Mode</label>
              <select
                value={newWorkMode}
                onChange={(e) => setNewWorkMode(e.target.value as WorkMode)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Work From Office">Work From Office</option>
                <option value="Work From Home">Work From Home</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="ambizcon-gradient text-white shadow-glow">
              {isSubmitting ? 'Creating...' : 'Create Member'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* In-App Delete User Modal (Div layout - No native browser confirm) */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Remove Workspace Member"
        description="Are you sure you want to remove this user from the workspace roster?"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-950 dark:text-rose-200 text-xs">
            <span className="font-bold block text-rose-700 dark:text-rose-400">⚠️ Permanent Removal</span>
            <span>Are you sure you want to delete workspace user "{userToDelete?.name}"?</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button variant="outline" size="sm" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create New Team Modal */}
      <Modal
        isOpen={isAddTeamModalOpen}
        onClose={() => setIsAddTeamModalOpen(false)}
        title="Add New Workspace Team"
        description="Create a new team squad to organize employees, tasks, and permissions."
        maxWidth="md"
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-foreground">Team Name *</label>
            <input
              type="text"
              value={newTeamNameInput}
              onChange={(e) => setNewTeamNameInput(e.target.value)}
              placeholder="e.g. Operations, UI/UX Design, QA & Testing, Finance"
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Team Description / Mission</label>
            <textarea
              value={newTeamDescInput}
              onChange={(e) => setNewTeamDescInput(e.target.value)}
              placeholder="Describe the responsibilities and focus of this squad..."
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button type="button" variant="outline" onClick={() => setIsAddTeamModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="ambizcon-gradient text-white shadow-glow">
              Save & Add Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Member Completed Tasks Explorer Modal */}
      <CompletedTasksExplorerModal
        isOpen={isCompletedModalOpen}
        onClose={() => setIsCompletedModalOpen(false)}
        users={filteredUsers.length > 0 ? filteredUsers : companyScopedUsers}
        initialMemberId={completedModalMemberId}
        initialPeriod={completedModalPeriod}
      />
    </div>
  );
}
