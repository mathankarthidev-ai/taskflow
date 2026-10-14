'use client';

import React, { useEffect, useState } from 'react';
import { useSearchStore } from '@/store/useSearchStore';
import { useTaskStore } from '@/store/useTaskStore';
import { Modal } from '../ui/Modal';
import { Search, CheckCircle2, User as UserIcon, Tag, ArrowRight } from 'lucide-react';
import { Task, User } from '@/types';
import { fetchTasksAction } from '@/actions/taskActions';
import { fetchAllUsersAction } from '@/actions/userActions';
import { useRouter } from 'next/navigation';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

export function GlobalSearchModal() {
  const { isOpen, setIsOpen, query, setQuery } = useSearchStore();
  const setSelectedTask = useTaskStore((s) => s.setSelectedTask);
  const setDetailModalOpen = useTaskStore((s) => s.setDetailModalOpen);
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    if (isOpen && query.trim().length > 0) {
      setLoading(true);
      Promise.all([
        fetchTasksAction({ search: query }),
        fetchAllUsersAction(),
      ]).then(([taskList, userList]) => {
        setTasks(taskList || []);
        const qLower = query.toLowerCase();
        const filteredUsers = (userList || []).filter(
          (u) =>
            u &&
            ((u.name || '').toLowerCase().includes(qLower) ||
              (u.email || '').toLowerCase().includes(qLower) ||
              (u.role || '').toLowerCase().includes(qLower))
        );
        setUsers(filteredUsers);
        setLoading(false);
      });
    } else {
      setTasks([]);
      setUsers([]);
    }
  }, [isOpen, query]);

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    setDetailModalOpen(true);
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} maxWidth="xl">
      <div className="space-y-4">
        {/* Input Bar */}
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type to search tasks, users, tags..."
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 py-3 pl-10 pr-4 text-sm focus-ring text-foreground"
            autoFocus
          />
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="py-8 text-center text-xs text-muted-foreground">Searching workspace...</div>
        ) : query.trim().length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Type a task title, label, or user name to find instantly.
          </div>
        ) : tasks.length === 0 && users.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No matching tasks or users found for "{query}".
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {/* Tasks Section */}
            {tasks.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Tasks ({tasks.length})
                </div>
                {tasks.map((task) => (
                  <button
                    key={task._id}
                    onClick={() => handleSelectTask(task)}
                    className="flex w-full items-center justify-between rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-card p-3 hover:bg-accent transition-colors text-left group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <span>{task.team}</span>
                          <span>•</span>
                          <span>{task.status}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            )}

            {/* Users Section */}
            {users.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  Team Members ({users.length})
                </div>
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} name={user.name} size="sm" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {user.role}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
