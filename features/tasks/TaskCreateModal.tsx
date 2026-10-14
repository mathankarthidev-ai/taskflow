'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore } from '@/store/useTaskStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { TaskPriority, TaskStatus, TeamName, User, TaskTypeTemplate } from '@/types';
import { createTaskAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { toast } from 'sonner';

import { getStoredClients, addClient } from '@/lib/client-db';
import { Paperclip, Plus, Building2, UploadCloud, AlertCircle, Trash2, Sparkles, CheckSquare } from 'lucide-react';

import { SEED_TASK_TYPES, SEED_PROJECTS } from '@/lib/seed-data';
import { useCompanyStore } from '@/store/useCompanyStore';
import { isUserInCompany } from '@/lib/company-filter';

const CUSTOM_TEMPLATES_KEY = 'ambizcon_custom_task_templates';

function getStoredCustomTemplates(): TaskTypeTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomTemplatesToStorage(templates: TaskTypeTemplate[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save custom templates:', e);
  }
}

export function TaskCreateModal() {
  const { isCreateModalOpen, setCreateModalOpen, setTasks, tasks } = useTaskStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const selectedCompany = useCompanyStore((s) => s.selectedCompany);
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';
  const activeCompanyScope = isSuperAdmin
    ? selectedCompany
    : currentUser?.company === 'Ambizcon'
    ? 'Ambizcon'
    : 'Ambizcon Health - India';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [status, setStatus] = useState<TaskStatus>('Todo');
  const [targetTeam, setTargetTeam] = useState<TeamName>('Creative');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [labelsInput, setLabelsInput] = useState('UI/UX, SaaS');
  const [isCrossTeam, setIsCrossTeam] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Template, Project & Recurring State
  const [selectedTaskType, setSelectedTaskType] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [estimatedHours, setEstimatedHours] = useState<number>(8);

  // Repetitive Task Templates State
  const [customTemplates, setCustomTemplates] = useState<TaskTypeTemplate[]>([]);
  const [isAddingCustomTemplate, setIsAddingCustomTemplate] = useState(false);
  const [newTmplName, setNewTmplName] = useState('');
  const [newTmplCategory, setNewTmplCategory] = useState<string>('Creative');
  const [newTmplEstimatedHours, setNewTmplEstimatedHours] = useState<number>(4);
  const [newTmplDescription, setNewTmplDescription] = useState('');
  const [newTmplChecklistText, setNewTmplChecklistText] = useState('');

  // Client Selection State
  const [clients, setClients] = useState(getStoredClients());
  const [selectedClient, setSelectedClient] = useState<string>('Apollo Hospitals');
  const [isAddingNewClient, setIsAddingNewClient] = useState(false);
  const [newClientInput, setNewClientInput] = useState('');

  // Doctor & Specialist State
  const [doctorName, setDoctorName] = useState('');
  const [specialist, setSpecialist] = useState('General Practice / GP');

  // Attachment State
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string; size: string; bytes: number }[]>([]);

  useEffect(() => {
    if (currentUser) {
      setTargetTeam(currentUser.team);
    }
    fetchAllUsersAction().then(setUsers);
    setClients(getStoredClients());
    setCustomTemplates(getStoredCustomTemplates());
  }, [currentUser, isCreateModalOpen]);

  const allTemplates = [...customTemplates, ...SEED_TASK_TYPES];

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === '__new_custom__') {
      setIsAddingCustomTemplate(true);
      return;
    }
    setSelectedTaskType(templateId);
    if (!templateId) return;

    const tmpl = allTemplates.find((t) => t.id === templateId);
    if (tmpl) {
      setTitle(tmpl.name);
      const checklistFormatted =
        tmpl.defaultChecklist && tmpl.defaultChecklist.length > 0
          ? `\n\nChecklist:\n${tmpl.defaultChecklist.map((c) => `[ ] ${c}`).join('\n')}`
          : '';
      setDescription(`${tmpl.description}${checklistFormatted}`);
      setEstimatedHours(tmpl.defaultEstimatedHours);
      if (tmpl.category.includes('Development')) {
        setTargetTeam('Development');
      } else if (tmpl.category.includes('Marketing')) {
        setTargetTeam('Marketing');
      } else if (tmpl.category.includes('Creative')) {
        setTargetTeam('Creative');
      }
      toast.info(`Applied Task Template: "${tmpl.name}"`, {
        description: `Auto-populated description & checklist (${tmpl.defaultChecklist.length} items).`,
      });
    }
  };

  const handleSaveCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTmplName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    if (!newTmplDescription.trim()) {
      toast.error('Please enter a description for this repetitive task');
      return;
    }

    const parsedChecklist = newTmplChecklistText
      .split('\n')
      .map((line) => line.replace(/^(\[\s*\]|-|\*|•|\d+\.)\s*/i, '').trim())
      .filter(Boolean);

    const newTmpl: TaskTypeTemplate = {
      id: `custom_tmpl_${Date.now()}`,
      name: newTmplName.trim(),
      category: newTmplCategory,
      description: newTmplDescription.trim(),
      defaultEstimatedHours: Number(newTmplEstimatedHours) || 4,
      defaultChecklist: parsedChecklist,
    };

    const updated = [newTmpl, ...customTemplates];
    setCustomTemplates(updated);
    saveCustomTemplatesToStorage(updated);

    // Auto-apply this new template to current task form
    setTitle(newTmpl.name);
    const checklistFormatted =
      newTmpl.defaultChecklist.length > 0
        ? `\n\nChecklist:\n${newTmpl.defaultChecklist.map((c) => `[ ] ${c}`).join('\n')}`
        : '';
    setDescription(`${newTmpl.description}${checklistFormatted}`);
    setEstimatedHours(newTmpl.defaultEstimatedHours);
    setSelectedTaskType(newTmpl.id);
    if (newTmpl.category.includes('Development')) {
      setTargetTeam('Development');
    } else if (newTmpl.category.includes('Marketing')) {
      setTargetTeam('Marketing');
    } else if (newTmpl.category.includes('Creative')) {
      setTargetTeam('Creative');
    }

    setIsAddingCustomTemplate(false);
    setNewTmplName('');
    setNewTmplDescription('');
    setNewTmplChecklistText('');
    setNewTmplEstimatedHours(4);

    toast.success(`Repetitive Task Template "${newTmpl.name}" saved!`, {
      description: 'You can now select this template anytime from Quick Start.',
    });
  };

  const handleDeleteCustomTemplate = (id: string, name: string) => {
    const updated = customTemplates.filter((t) => t.id !== id);
    setCustomTemplates(updated);
    saveCustomTemplatesToStorage(updated);
    if (selectedTaskType === id) {
      setSelectedTaskType('');
    }
    toast.info(`Template "${name}" deleted.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: { name: string; url: string; type: string; size: string; bytes: number }[] = [];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > MAX_SIZE) {
        toast.error(`File "${file.name}" exceeds 5MB limit! Uploads must be strictly less than 5MB.`, {
          description: `File size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        });
        continue;
      }

      const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${Math.round(file.size / 1024)} KB`;
      const url = URL.createObjectURL(file);
      newItems.push({
        name: file.name,
        url,
        type: file.type || 'application/octet-stream',
        size: sizeStr,
        bytes: file.size,
      });
    }

    if (newItems.length > 0) {
      setAttachments((prev) => [...prev, ...newItems]);
      toast.success(`Attached ${newItems.length} document(s) (< 5MB verified)`);
    }
  };

  const handleCreateNewClient = () => {
    if (!newClientInput.trim() || !currentUser) return;
    const created = addClient(newClientInput.trim(), currentUser.name, currentUser.role);
    setClients(getStoredClients());
    setSelectedClient(created.name);
    setIsAddingNewClient(false);
    setNewClientInput('');
    if (created.status === 'pending_admin_approval') {
      toast.success(`New Client "${created.name}" created! Submitted for Admin Approval.`, {
        description: 'Team Leads can propose new clients; Super Admin signoff is required.',
      });
    } else {
      toast.success(`Client "${created.name}" added successfully!`);
    }
  };


  if (!currentUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      const labels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const isIncoming = isCrossTeam || targetTeam !== currentUser.team;
      const approvalStatus = currentUser.role === 'Team Member' ? 'pending_approval' : 'approved';

      const createdTask: any = await createTaskAction({
        title,
        description,
        priority,
        status,
        team: targetTeam,
        assignedTo: isIncoming ? undefined : (assignedTo || currentUser._id),
        createdBy: currentUser._id,
        raisedBy: isIncoming ? currentUser._id : undefined,
        incoming: isIncoming,
        dueDate: new Date(dueDate).toISOString(),
        labels,
        attachments: attachments.map((a) => ({ name: a.name, url: a.url, type: a.type, size: a.size })),
        clientName: selectedClient,
        doctorName: doctorName.trim() || undefined,
        specialist: specialist || undefined,
      });

      const fullTask = {
        ...createdTask,
        clientName: selectedClient,
        doctorName: doctorName.trim() || undefined,
        specialist: specialist || undefined,
        clientApproved: true,
        approvalStatus,
        history: [
          {
            id: `hist_${Date.now()}`,
            action: `Task created by ${currentUser.name} (${currentUser.role})`,
            performedBy: currentUser.name,
            performedRole: currentUser.role,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      setTasks([fullTask, ...tasks]);

      // Push real-time System Notification
      useNotificationStore.getState().addNotification({
        type: 'assigned',
        category: 'Task Assigned',
        title: '📌 New Task Assigned',
        text: `Task "${title}" created and assigned by ${currentUser.name}.`,
        color: 'bg-blue-500',
      });

      if (approvalStatus === 'pending_approval') {
        useNotificationStore.getState().addNotification({
          type: 'task_approval',
          category: 'Task Approval Request',
          title: '🛡️ Member Task Pending Approval',
          text: `Task "${title}" created by ${currentUser.name} requires Team Lead approval.`,
          color: 'bg-amber-600',
        });
        toast.success(`Task "${title}" created! Pending TL or Admin approval.`, {
          description: 'Team Lead or Super Admin will receive a notification to approve your task.',
        });
      } else {
        toast.success(
          isIncoming
            ? `Task raised to ${targetTeam} Incoming Queue!`
            : 'Task created successfully!'
        );
      }

      setCreateModalOpen(false);

      // Reset Form
      setTitle('');
      setDescription('');
      setAttachments([]);
    } catch (err) {
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={() => setCreateModalOpen(false)}
      title="Create Task"
      description="Add a task to your team board or raise a cross-team request."
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Task Type Template Selector */}
        <div className="p-3.5 rounded-2xl border border-brand-500/30 bg-brand-500/10 dark:bg-brand-500/5 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>⚡ Quick Start: Select Task Template (Auto-creates Checklists & Estimates)</span>
            </label>
            {!isAddingCustomTemplate && (
              <button
                type="button"
                onClick={() => setIsAddingCustomTemplate(true)}
                className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                Add Repetitive Task & Description
              </button>
            )}
          </div>

          {!isAddingCustomTemplate ? (
            <div className="space-y-2">
              <select
                value={selectedTaskType}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full rounded-xl border border-brand-500/40 bg-background px-3 py-2 text-xs font-semibold focus-ring"
              >
                <option value="">-- Custom Task / No Template --</option>

                {customTemplates.length > 0 && (
                  <optgroup label={`── 🌟 Your Saved Repetitive Tasks (${customTemplates.length}) ──`}>
                    {customTemplates.map((tmpl) => (
                      <option key={tmpl.id} value={tmpl.id}>
                        ⭐ {tmpl.name} ({tmpl.category} · {tmpl.defaultEstimatedHours}h · {tmpl.defaultChecklist.length} checklist items)
                      </option>
                    ))}
                  </optgroup>
                )}

                <optgroup label="── 📝 Marketing, Content & SEO Tasks ──">
                  {SEED_TASK_TYPES.filter((t) =>
                    [
                      'tt_blogs_drafting',
                      'tt_content_creation',
                      'tt_mailer',
                      'tt_seo_keywords',
                      'tt_website_content_drafting',
                      'tt_blog',
                      'tt_seo_revamp',
                      'tt_seo_audit',
                      'tt_google_ads',
                      'tt_monthly_social_planning',
                      'tt_awareness_day_content',
                    ].includes(t.id)
                  ).map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      📌 {tmpl.name} ({tmpl.category} · {tmpl.defaultEstimatedHours}h · {tmpl.defaultChecklist.length} checklist items)
                    </option>
                  ))}
                </optgroup>

                <optgroup label="── 💻 Development, Website & Logs Tasks ──">
                  {SEED_TASK_TYPES.filter((t) =>
                    [
                      'tt_daily_user_log',
                      'tt_page_creation',
                      'tt_monthly_tasks_page_speed',
                      'tt_website_task_backup',
                      'tt_wp_build',
                      'tt_wp_maintenance',
                      'tt_speed_opt',
                    ].includes(t.id)
                  ).map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      🛠️ {tmpl.name} ({tmpl.category} · {tmpl.defaultEstimatedHours}h · {tmpl.defaultChecklist.length} checklist items)
                    </option>
                  ))}
                </optgroup>

                <optgroup label="── 🎨 Creative & Media Design Tasks ──">
                  {SEED_TASK_TYPES.filter((t) =>
                    [
                      'tt_weekly_social_media',
                      'tt_video_production_editing',
                      'tt_meta_ads_creatives',
                      'tt_client_design_collateral',
                      'tt_client_revisions_delivery',
                    ].includes(t.id)
                  ).map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      🎨 {tmpl.name} ({tmpl.category} · {tmpl.defaultEstimatedHours}h · {tmpl.defaultChecklist.length} checklist items)
                    </option>
                  ))}
                </optgroup>

                <option value="__new_custom__">+ Create New Repetitive Task & Description...</option>
              </select>

              {/* Template Selected Preview / Clear Banner */}
              {selectedTaskType && (
                (() => {
                  const activeTmpl = allTemplates.find((t) => t.id === selectedTaskType);
                  if (!activeTmpl) return null;
                  const isCustom = customTemplates.some((t) => t.id === activeTmpl.id);
                  return (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-background border border-brand-500/30 text-xs shadow-sm">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-foreground truncate">
                          Applied: {activeTmpl.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ({activeTmpl.defaultChecklist.length} Checklist Items · {activeTmpl.defaultEstimatedHours}h)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isCustom && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCustomTemplate(activeTmpl.id, activeTmpl.name)}
                            className="text-[10px] text-rose-500 hover:underline cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTaskType('');
                            setTitle('');
                            setDescription('');
                          }}
                          className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          ) : (
            /* Inline Form to Add Repetitive Task & Description */
            <div className="p-3 rounded-xl border border-brand-500/40 bg-background space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-zinc-200/60 dark:border-zinc-800/60">
                <div>
                  <h4 className="text-xs font-bold text-foreground">Add New Repetitive Task & Description</h4>
                  <p className="text-[10px] text-muted-foreground">Save reusable task blueprint with description & checklist</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingCustomTemplate(false)}
                  className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Task Template Name *</label>
                  <input
                    type="text"
                    value={newTmplName}
                    onChange={(e) => setNewTmplName(e.target.value)}
                    placeholder="e.g. Weekly Email Campaign"
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Department</label>
                  <select
                    value={newTmplCategory}
                    onChange={(e) => setNewTmplCategory(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
                  >
                    <option value="Creative">Creative</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Development">Development</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Task Description *</label>
                <textarea
                  value={newTmplDescription}
                  onChange={(e) => setNewTmplDescription(e.target.value)}
                  placeholder="Regular description of this repetitive deliverable..."
                  rows={2}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Checklist Items (One per line)</span>
                  <span className="text-[10px] text-muted-foreground">Auto-converts to [ ] checkboxes</span>
                </label>
                <textarea
                  value={newTmplChecklistText}
                  onChange={(e) => setNewTmplChecklistText(e.target.value)}
                  placeholder="Review brief&#10;Design initial drafts&#10;Internal review&#10;Client revisions & approval"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs font-mono focus-ring"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-semibold text-foreground">Est. Hours:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newTmplEstimatedHours}
                    onChange={(e) => setNewTmplEstimatedHours(Number(e.target.value))}
                    className="w-16 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-background px-2 py-1 text-xs text-center focus-ring font-mono"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddingCustomTemplate(false)}
                    className="text-xs py-1 px-3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveCustomTemplate}
                    className="ambizcon-gradient text-white text-xs py-1 px-3 font-bold"
                  >
                    Save & Apply Template
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="text-xs font-semibold text-foreground">Task Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Implement WordPress Core Update & Backup"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            required
          />
        </div>

        {/* Client & Project Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Client Selector */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-brand-500" />
                Client Profile *
              </label>
              {!isAddingNewClient && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewClient(true)}
                  className="text-[11px] font-bold text-brand-500 hover:underline flex items-center gap-0.5"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
            </div>

            {!isAddingNewClient ? (
              <select
                value={selectedClient}
                onChange={(e) => {
                  if (e.target.value === '__add_new__') {
                    setIsAddingNewClient(true);
                  } else {
                    setSelectedClient(e.target.value);
                  }
                }}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring max-h-60"
              >
                {['Medical Centers', 'Cardiologists', 'Specialist', 'Telehealth', 'Wellness', 'Diagnostics', 'Dermatology / Cosmetics', 'Business / Other Services', 'Others'].map((cat) => {
                  const catClients = clients.filter((c) => (c.category || 'Business / Other Services') === cat);
                  if (catClients.length === 0) return null;
                  return (
                    <optgroup key={cat} label={`── ${cat} (${catClients.length}) ──`}>
                      {catClients.map((c) => (
                        <option key={c.id} value={c.name}>
                          🏢 {c.name} {c.status === 'pending_admin_approval' ? '(Pending Admin Approval)' : ''}
                        </option>
                      ))}
                    </optgroup>
                  );
                })}
                <option value="__add_new__">+ Add New Client...</option>
              </select>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newClientInput}
                  onChange={(e) => setNewClientInput(e.target.value)}
                  placeholder="New Client / Practice name..."
                  className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-2.5 py-1.5 text-xs focus-ring"
                />
                <Button type="button" size="sm" onClick={handleCreateNewClient} className="text-[11px] py-1.5 px-3 bg-brand-600 text-white font-bold">
                  Save Client
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setIsAddingNewClient(false)} className="text-[11px] py-1.5 px-2.5">
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Project Selector */}
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Associated Project
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              <option value="">-- General Client Retainer Work --</option>
              {SEED_PROJECTS.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  📁 {proj.title} ({proj.clientName})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Doctor Name & Specialist Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Doctor's Name / Physician
            </label>
            <input
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma, MD"
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            />
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Specialist / Medical Specialty
            </label>
            <select
              value={specialist}
              onChange={(e) => setSpecialist(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs font-semibold focus-ring"
            >
              <option value="General Practice / GP">General Practice / GP</option>
              <option value="Gastroenterology">Gastroenterology</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Dermatology & Cosmetics">Dermatology & Cosmetics</option>
              <option value="Radiology & Diagnostics">Radiology & Diagnostics</option>
              <option value="Dentistry">Dentistry</option>
              <option value="Telehealth Specialist">Telehealth Specialist</option>
              <option value="Wellness & Psychology">Wellness & Psychology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Practice Management & Others">Practice Management & Others</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-semibold text-foreground">Description & Checklist</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed description of task specifications..."
            rows={4}
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring font-mono text-xs"
          />
        </div>

        {/* Cross-Team Request Option */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-3">
          <div>
            <p className="text-xs font-semibold text-foreground">Cross-Team Request</p>
            <p className="text-[11px] text-muted-foreground">Raise task to another team's Incoming Queue</p>
          </div>
          <input
            type="checkbox"
            checked={isCrossTeam}
            onChange={(e) => setIsCrossTeam(e.target.checked)}
            className="h-4 w-4 rounded accent-primary cursor-pointer"
          />
        </div>

        {/* Team & Assignee Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground">
              Assigned Team {!isSuperAdmin && !isCrossTeam && <span className="text-[10px] text-blue-500 font-normal">(Your Team)</span>}
            </label>
            <select
              value={targetTeam}
              onChange={(e) => {
                const nextTeam = e.target.value as TeamName;
                setTargetTeam(nextTeam);
                setAssignedTo('');
              }}
              disabled={!isSuperAdmin && !isCrossTeam}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {(isSuperAdmin || isCrossTeam) ? (
                <>
                  <option value="Creative">Creative Team</option>
                  <option value="Marketing">Marketing Team</option>
                  <option value="Development">Development Team</option>
                </>
              ) : (
                <option value={currentUser.team}>{currentUser.team} Team</option>
              )}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">
              {isCrossTeam
                ? 'Assigned User (Lead Review)'
                : currentUser.role === 'Team Member'
                ? 'Assigned Member (Handled by TL)'
                : 'Assigned Member'}
            </label>
            <select
              value={currentUser.role === 'Team Member' && !isCrossTeam ? currentUser._id : assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              disabled={isCrossTeam || currentUser.role === 'Team Member'}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {currentUser.role === 'Team Member' && !isCrossTeam ? (
                <option value={currentUser._id}>
                  {currentUser.name} ({currentUser.role})
                </option>
              ) : (
                <>
                  <option value="">-- Auto-assign / Unassigned --</option>
                  {users
                    .filter((u) => {
                      if (!isUserInCompany(u, activeCompanyScope)) return false;
                      if (isSuperAdmin) return u.team === targetTeam || u.role === 'Super Admin';
                      if (currentUser.role === 'Team Lead') {
                        return u.team === currentUser.team && u.role !== 'Super Admin';
                      }
                      return u._id === currentUser._id;
                    })
                    .map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </>
              )}
            </select>
          </div>
        </div>

        {/* Priority, Status, Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-foreground">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
            >
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Review">Review</option>
              <option value="Support">Support</option>
              <option value="Done">Done</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
              required
            />
          </div>
        </div>

        {/* Document File Attachment Upload (< 5MB limit) */}
        <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/40 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <UploadCloud className="h-4 w-4 text-emerald-500" />
              Attach Task Documents (Strictly &lt; 5MB limit)
            </label>
            <span className="text-[10px] text-muted-foreground font-mono">Supports PDF, PNG, JPG, DOC, ZIP</span>
          </div>

          <input
            type="file"
            multiple
            onChange={handleFileUpload}
            className="block w-full text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-500/10 file:text-emerald-600 hover:file:bg-emerald-500/20 cursor-pointer"
          />

          {attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-background border border-zinc-200 dark:border-zinc-800">
                  <span className="font-semibold text-foreground truncate max-w-[240px] flex items-center gap-1">
                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                    {att.name}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 font-bold">{att.size}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labels */}
        <div>
          <label className="text-xs font-semibold text-foreground">Labels (comma separated)</label>
          <input
            type="text"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            placeholder="e.g. Design, Frontend, Priority"
            className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-sm focus-ring"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : isCrossTeam ? 'Raise Cross-Team Request' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

