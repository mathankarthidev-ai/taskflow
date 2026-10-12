'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Task, TaskPriority, TaskStatus, TeamName, User, ReminderSettings } from '@/types';
import { updateTaskAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { getStoredClients } from '@/lib/client-db';
import { canEditTaskOrReminder, getTaskCreatorName } from '@/lib/permissions';
import { toast } from 'sonner';
import {
  Edit3,
  Calendar,
  Clock,
  Building2,
  User as UserIcon,
  ShieldCheck,
  Tag,
  AlertCircle,
  Bell,
  Lock,
  Sparkles,
} from 'lucide-react';

interface TaskEditModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (updatedTask: Task) => void;
}

import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany } from '@/lib/company-filter';

export function TaskEditModal({ task, isOpen, onClose, onUpdated }: TaskEditModalProps) {
  const { tasks, setTasks, setSelectedTask } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const activeCompanyScope = isSuperAdmin
    ? selectedCompany
    : currentUser?.company === 'Ambizcon'
    ? 'Ambizcon'
    : 'Ambizcon Health - India';

  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [team, setTeam] = useState<TeamName>('Development');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('');
  const [specialist, setSpecialist] = useState<string>('');
  const [labelsInput, setLabelsInput] = useState<string>('');

  // Reminder Fields
  const [hasReminder, setHasReminder] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Yearly' | 'Custom'>('Daily');
  const [reminderTime, setReminderTime] = useState('09:30 AM');
  const [reminderDate, setReminderDate] = useState('');
  const [remindBeforeDays, setRemindBeforeDays] = useState(7);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authorization
  const canEdit = canEditTaskOrReminder(task, currentUser);
  const creatorName = getTaskCreatorName(task);
  const isReminder = Boolean(task?.reminderSettings?.enabled);

  useEffect(() => {
    if (isOpen) {
      fetchAllUsersAction().then(setUsers);
      setClients(getStoredClients());
    }
  }, [isOpen]);

  useEffect(() => {
    if (task && isOpen) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setPriority(task.priority || 'Medium');
      setStatus(task.status || 'Todo');
      setTeam(task.team || 'Development');
      setAssignedTo(task.assignedTo || (task.assignedUser ? task.assignedUser._id : ''));
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] : '');
      setClientName(task.clientName || '');
      setDoctorName(task.doctorName || '');
      setSpecialist(task.specialist || '');
      setLabelsInput(Array.isArray(task.labels) ? task.labels.join(', ') : '');

      if (task.reminderSettings?.enabled) {
        setHasReminder(true);
        setReminderFrequency(task.reminderSettings.frequency || 'Daily');
        setReminderTime(task.reminderSettings.reminderTime || '09:30 AM');
        setReminderDate(task.reminderSettings.reminderDate || '');
        setRemindBeforeDays(task.reminderSettings.remindBeforeDays || 7);
      } else {
        setHasReminder(false);
      }
    }
  }, [task, isOpen]);

  if (!task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast.error('Permission Denied', {
        description: `Only Admin or the creator (${creatorName}) can edit this ${isReminder ? 'reminder' : 'task'}.`,
      });
      return;
    }

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const reminderSettings: ReminderSettings | undefined = hasReminder
        ? {
            enabled: true,
            frequency: reminderFrequency,
            reminderDate: reminderDate || dueDate || new Date().toISOString().split('T')[0],
            reminderTime,
            remindBeforeDays,
            repeatEndsOption: 'never',
            summaryText: `${reminderFrequency} reminder for ${clientName || 'task'} at ${reminderTime}.`,
          }
        : task.reminderSettings?.enabled
        ? { ...task.reminderSettings, enabled: false }
        : undefined;

      const updates: Partial<Task> = {
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        team,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : task.dueDate,
        clientName: clientName || undefined,
        doctorName: doctorName.trim() || undefined,
        specialist: specialist.trim() || undefined,
        labels,
        reminderSettings,
        history: [
          ...(task.history || []),
          {
            id: `hist_${Date.now()}`,
            action: `Edited by ${currentUser.name} (${currentUser.role})`,
            performedBy: currentUser.name,
            performedRole: currentUser.role,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      const updated = await updateTaskAction(
        task._id,
        updates,
        currentUser._id,
        currentUser.role,
        currentUser.name
      );

      if (updated) {
        setTasks(tasks.map((t) => (t._id === updated._id ? updated : t)));
        setSelectedTask(updated);
        if (onUpdated) onUpdated(updated);
        toast.success(`${isReminder ? 'Reminder' : 'Task'} updated successfully!`);
        onClose();
      }
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast.error(err?.message || 'Failed to update task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReminder ? 'Edit Reminder Alert' : 'Edit Task Details'}
      description={
        canEdit
          ? `Modify specifications, priority, assignee, and schedule.`
          : `Viewing details for ${isReminder ? 'reminder' : 'task'} created by ${creatorName}.`
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
        {/* Permission Notice Banner */}
        {!canEdit ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-amber-700 dark:text-amber-400">
            <Lock className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-xs">Read-Only Mode: Edit Permission Restricted</p>
              <p className="text-[11px] opacity-90 leading-relaxed">
                This {isReminder ? 'reminder' : 'task'} was created by{' '}
                <strong>{creatorName}</strong>. As per enterprise role security policy, Team Leads
                and Members can only edit tasks/reminders they created themselves. Administrators
                have global edit privileges.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-emerald-700 dark:text-emerald-300">
            <span className="flex items-center gap-1.5 font-semibold text-[11px]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin'
                ? 'Admin Global Edit Privilege Active'
                : `Editing task created by you (${currentUser?.name})`}
            </span>
            <Badge variant="outline" className="text-[9px] font-mono border-emerald-500/30">
              Authorized
            </Badge>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="font-bold text-foreground block mb-1">
            {isReminder ? 'Reminder Title / Subject' : 'Task Title'} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
            placeholder="Enter title"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
            required
          />
        </div>

        {/* Description / Checklist */}
        <div>
          <label className="font-bold text-foreground block mb-1">
            Description / Deliverable Checklist
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!canEdit}
            placeholder="Provide context, deliverables, or checklist steps..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
          />
        </div>

        {/* Priority & Status */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-foreground block mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-medium focus-ring disabled:opacity-60"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High 🔥</option>
              <option value="Critical">Critical ⚡</option>
              <option value="Urgent">Urgent 🚨</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-medium focus-ring disabled:opacity-60"
            >
              <option value="Backlog">Backlog</option>
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review / Testing</option>
              <option value="Support">Support</option>
              <option value="Done">Completed</option>
            </select>
          </div>
        </div>

        {/* Team & Assignee */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-foreground block mb-1">Team</label>
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value as TeamName)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-medium focus-ring disabled:opacity-60"
            >
              <option value="Creative">Creative</option>
              <option value="Marketing">Marketing</option>
              <option value="Development">Development</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">Assignee</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-medium focus-ring disabled:opacity-60"
            >
              <option value="">Unassigned</option>
              {users
                .filter((u) => isUserInCompany(u, activeCompanyScope))
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.team} • {u.role})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Due Date & Client */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-foreground block mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring disabled:opacity-60"
            />
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">Client Name</label>
            <select
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={!canEdit}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-medium focus-ring disabled:opacity-60"
            >
              <option value="">No Client / Internal</option>
              {clients.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor & Specialist (Healthcare context) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-foreground block mb-1">Doctor Name (Optional)</label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              disabled={!canEdit}
              placeholder="e.g. Dr. Umed, Dr. Sarah"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring disabled:opacity-60"
            />
          </div>

          <div>
            <label className="font-bold text-foreground block mb-1">Medical Specialist (Optional)</label>
            <input
              type="text"
              value={specialist}
              onChange={(e) => setSpecialist(e.target.value)}
              disabled={!canEdit}
              placeholder="e.g. General Practice, Cardiology"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring disabled:opacity-60"
            />
          </div>
        </div>

        {/* Labels */}
        <div>
          <label className="font-bold text-foreground block mb-1">Labels (Comma-separated)</label>
          <input
            type="text"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            disabled={!canEdit}
            placeholder="e.g. UI/UX, Mobile, SEO, Urgent"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring disabled:opacity-60"
          />
        </div>

        {/* Reminder Settings Accordion / Toggle */}
        <div className="p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer font-bold text-foreground">
              <input
                type="checkbox"
                checked={hasReminder}
                onChange={(e) => setHasReminder(e.target.checked)}
                disabled={!canEdit}
                className="h-4 w-4 rounded accent-brand-500"
              />
              <Bell className="h-3.5 w-3.5 text-brand-500" />
              Enable Recurring Reminder Alert
            </label>
            {hasReminder && (
              <Badge className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px]">
                {reminderFrequency}
              </Badge>
            )}
          </div>

          {hasReminder && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Frequency</label>
                <select
                  value={reminderFrequency}
                  onChange={(e) => setReminderFrequency(e.target.value as any)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring disabled:opacity-60"
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Trigger Time</label>
                <input
                  type="text"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  disabled={!canEdit}
                  placeholder="09:30 AM"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring disabled:opacity-60"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Start Date</label>
                <input
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                  disabled={!canEdit}
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring disabled:opacity-60"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            {canEdit ? 'Cancel' : 'Close'}
          </Button>

          {canEdit && (
            <Button
              type="submit"
              disabled={isSubmitting}
              size="sm"
              className="ambizcon-gradient text-white font-bold gap-1.5 shadow-glow"
            >
              <Edit3 className="h-3.5 w-3.5" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
