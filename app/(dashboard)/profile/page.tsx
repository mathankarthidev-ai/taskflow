'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { UserCheck, Mail, Shield, Building2, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const currentUser = useAuthStore((s) => s.currentUser);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">User Profile</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your TaskFlow account information and assigned persona credentials.</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <Avatar src={currentUser.avatar} name={currentUser.name} size="xl" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-foreground">{currentUser.name}</h2>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="default" className="text-xs">
                {currentUser.role}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {currentUser.team} Team
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 mt-6 border-t border-zinc-200/60 dark:border-zinc-800/60 text-xs">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Mail className="h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Authorized Email</span>
              <span className="font-mono text-foreground font-semibold">{currentUser.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Shield className="h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Access Level</span>
              <span className="text-foreground font-semibold">{currentUser.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Building2 className="h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Department</span>
              <span className="text-foreground font-semibold">{currentUser.team} Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 p-3">
            <Calendar className="h-4 w-4 text-zinc-400" />
            <div>
              <span className="text-[10px] text-muted-foreground block font-semibold uppercase">Status</span>
              <span className="text-emerald-500 font-semibold">Active Member</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
