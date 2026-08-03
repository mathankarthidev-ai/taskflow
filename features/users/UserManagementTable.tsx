'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, TeamName } from '@/types';
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
import { Users, UserPlus, Trash2, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function UserManagementTable() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<TeamName | 'All'>('All');

  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Team Member');
  const [newTeam, setNewTeam] = useState<TeamName>('Development');
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

    if (!newEmail.toLowerCase().endsWith('@taskflow.company')) {
      toast.error('Email must end with @taskflow.company');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createUserAction({
        name: newName.trim(),
        email: newEmail.trim(),
        role: newRole,
        team: newTeam,
      });

      setUsers([created, ...users]);
      toast.success(`User ${created.name} added successfully!`);
      setIsAddModalOpen(false);

      // Reset Form
      setNewName('');
      setNewEmail('');
    } catch (e) {
      toast.error('Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
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

  const handleSeedReset = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        toast.success('Database and Seed store re-initialized with 30+ tasks!');
        fetchUsers();
      }
    } catch (e) {
      toast.error('Failed to trigger database seed');
    } finally {
      setSeeding(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedTeamFilter !== 'All' && u.team !== selectedTeamFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">User & Member CRUD Console</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Super Admin control panel to create members, update roles, manage teams, and re-seed workspace data.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="gap-1.5 shadow-glow">
            <UserPlus className="h-4 w-4" />
            Add New Member
          </Button>

          <Button onClick={handleSeedReset} disabled={seeding} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Reset & Seed Data'}
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
                  <th className="px-4 py-3">Authorized Email</th>
                  <th className="px-4 py-3">Team</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Role Selector</th>
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
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value as UserRole)}
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1 text-xs focus-ring"
                      >
                        <option value="Team Member">Team Member</option>
                        <option value="Team Lead">Team Lead</option>
                        <option value="Super Admin">Super Admin</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(u._id, u.name)}
                        className="text-rose-500 hover:bg-rose-500/10"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add New Member Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Workspace Member"
        description="Create a new team member persona with authorized @taskflow.company credentials."
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
            <label className="text-xs font-semibold text-foreground">Company Email (@taskflow.company) *</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="sarah@taskflow.company"
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
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
