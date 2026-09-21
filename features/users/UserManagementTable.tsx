'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, TeamName, WorkMode, CompanyBranch } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import {
  fetchAllUsersAction,
  updateUserRoleAction,
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
import { Users, UserPlus, Trash2, Search, Edit3, DollarSign, Building2 } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<CompanyBranch | 'All'>('All');

  // Add Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDob, setNewDob] = useState('');
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
        email: newEmail.trim(),
        role: newRole,
        team: newTeam,
        company: newCompany,
      });

      setUsers([created, ...users]);
      toast.success(`User ${created.name} added successfully to ${newCompany}!`);
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
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

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updated = users.map((u) => {
      if (u._id === editingUser._id) {
        return {
          ...u,
          name: editName,
          email: editEmail,
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
    toast.success(`Employee ${editName} details updated successfully!`);
    setEditingUser(null);
  };

  const handleRoleChange = async (userId: string, role: UserRole) => {
    const updated = await updateUserRoleAction(userId, role);
    if (updated) {
      setUsers(users.map((u) => (u._id === userId ? updated : u)));
      toast.success(`Role updated to ${role}`);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser._id) {
      toast.error('You cannot delete your own logged-in Super Admin account');
      return;
    }

    if (confirm(`Are you sure you want to delete workspace user "${userName}"?`)) {
      const success = await deleteUserAction(userId);
      if (success) {
        setUsers(users.filter((u) => u._id !== userId));
        toast.success(`User ${userName} removed.`);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedTeamFilter !== 'All' && u.team !== selectedTeamFilter) return false;
    if (
      selectedCompanyFilter !== 'All' &&
      u.company !== 'India & Australia' &&
      u.name !== 'Anirudh' &&
      (u.company || 'Ambizcon Health - India') !== selectedCompanyFilter
    )
      return false;
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
          <Link href="/finance">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold">
              <DollarSign className="h-4 w-4" />
              Finance & Payroll Ledger
            </Button>
          </Link>

          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5 ambizcon-gradient text-white shadow-glow">
            <UserPlus className="h-4 w-4" />
            Add New Member
          </Button>
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
            <option value="Ambizcon - Australia">🇦🇺 Ambizcon - Australia</option>
          </select>

          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value as TeamName | 'All')}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-1.5 text-xs focus-ring"
          >
            <option value="All">All Workspace Teams</option>
            <option value="Creative">Creative Team</option>
            <option value="Marketing">Marketing Team</option>
            <option value="Development">Development Team</option>
          </select>
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
                  <th className="px-4 py-3">Birthday / DOB</th>
                  <th className="px-4 py-3">Work Mode</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/60 dark:border-zinc-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.avatar} name={u.name} size="sm" />
                        <span className="font-semibold text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-semibold whitespace-nowrap">
                        {u.company === 'India & Australia' || u.name === 'Anirudh'
                          ? '🌐 India & Australia'
                          : (u.company || 'Ambizcon Health - India') === 'Ambizcon - Australia'
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
                ))}
              </tbody>
            </table>
          </div>
        </Card>
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
                <option value="Ambizcon - Australia">🇦🇺 Ambizcon - Australia (Brisbane HQ)</option>
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
                  <option value="Creative">Creative Team</option>
                  <option value="Marketing">Marketing Team</option>
                  <option value="Development">Development Team</option>
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
              <option value="Ambizcon - Australia">🇦🇺 Ambizcon - Australia (Brisbane HQ)</option>
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
              <label className="text-xs font-semibold text-foreground">Assigned Team</label>
              <select
                value={newTeam}
                onChange={(e) => setNewTeam(e.target.value as TeamName)}
                className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              >
                <option value="Creative">Creative Team</option>
                <option value="Marketing">Marketing Team</option>
                <option value="Development">Development Team</option>
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
    </div>
  );
}
