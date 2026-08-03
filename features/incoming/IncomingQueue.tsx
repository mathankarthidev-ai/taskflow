'use client';

import React, { useState, useEffect } from 'react';
import { Task, User } from '@/types';
import { useAuthStore } from '@/store/useAuthStore';
import { useTaskStore } from '@/store/useTaskStore';
import { fetchTasksAction, assignTaskAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { getPriorityBadgeColor, formatDate } from '@/lib/utils';
import { Inbox, ArrowRight, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function IncomingQueue() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const { setSelectedTask, setDetailModalOpen } = useTaskStore();

  const [incomingTasks, setIncomingTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  useEffect(() => {
    async function loadIncoming() {
      setLoading(true);
      const [allTasks, allUsers] = await Promise.all([
        fetchTasksAction({ incoming: true }),
        fetchAllUsersAction(),
      ]);
      // Filter incoming tasks relevant to lead's team or Super Admin
      if (currentUser?.role === 'Super Admin') {
        setIncomingTasks(allTasks);
      } else if (currentUser) {
        setIncomingTasks(allTasks.filter((t) => t.team === currentUser.team));
      }
      setUsers(allUsers);
      setLoading(false);
    }
    loadIncoming();
  }, [currentUser]);

  if (!currentUser) return null;

  const isLeadOrAdmin = currentUser.role === 'Team Lead' || currentUser.role === 'Super Admin';

  const handleAssign = async (taskId: string, memberId: string) => {
    if (!memberId) return;
    setAssigningId(taskId);
    try {
      const updated = await assignTaskAction(taskId, memberId);
      if (updated) {
        setIncomingTasks(incomingTasks.filter((t) => t._id !== taskId));
        toast.success('Task assigned successfully and moved to team board!');
      }
    } catch (e) {
      toast.error('Failed to assign task');
    } finally {
      setAssigningId(null);
    }
  };

  if (!isLeadOrAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold">Team Lead Access Required</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          The Incoming Queue is reserved for Team Leads and Super Admins to review cross-team requests and assign team members.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-transparent p-6 glass-panel">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {currentUser.team} Incoming Queue
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review requests raised from other teams, assign responsible team members, and accept into workspace.
            </p>
          </div>
        </div>
        <Badge variant="default" className="text-xs px-3 py-1">
          {incomingTasks.length} Pending Approval
        </Badge>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : incomingTasks.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle className="text-base">Incoming Queue is Clean!</CardTitle>
            <CardDescription className="text-xs">
              All cross-team requests for {currentUser.team} team have been reviewed and assigned.
            </CardDescription>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {incomingTasks.map((task) => {
            const teamMembers = users.filter((u) => u.team === task.team);

            return (
              <Card
                key={task._id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 hover:border-primary/50 transition-colors"
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getPriorityBadgeColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Target Team: {task.team}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Due: {formatDate(task.dueDate)}</span>
                  </div>

                  <h3
                    onClick={() => {
                      setSelectedTask(task);
                      setDetailModalOpen(true);
                    }}
                    className="text-base font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {task.title}
                  </h3>

                  <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <span>Raised by:</span>
                    <div className="flex items-center gap-1 font-medium text-foreground">
                      <Avatar
                        src={task.raisedByUser?.avatar || task.createdByUser?.avatar}
                        name={task.raisedByUser?.name || task.createdByUser?.name || 'User'}
                        size="sm"
                      />
                      <span>{task.raisedByUser?.name || task.createdByUser?.name}</span>
                    </div>
                  </div>
                </div>

                {/* Right Action: Assign Dropdown */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-200/60 dark:border-zinc-800/60">
                  <select
                    defaultValue=""
                    disabled={assigningId === task._id}
                    onChange={(e) => handleAssign(task._id, e.target.value)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
                  >
                    <option value="" disabled>
                      Select Team Member to Assign...
                    </option>
                    {teamMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>

                  <Button
                    onClick={() => {
                      setSelectedTask(task);
                      setDetailModalOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                  >
                    Details
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
