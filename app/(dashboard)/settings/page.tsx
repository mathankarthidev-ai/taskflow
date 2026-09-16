'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sun, Moon, Laptop, Globe, Bell, Shield, Save, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [language, setLanguage] = useState('English (US)');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  // Single-Use Password Reset State
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [hasResetOnce, setHasResetOnce] = useState(false);

  if (!currentUser) return null;

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (hasResetOnce || currentUser.hasResetPassword) {
      toast.error('Password has already been reset once. Contact IT Administrator to request another change.');
      return;
    }

    if (!newPw || newPw.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }

    if (newPw !== confirmPw) {
      toast.error('New passwords do not match');
      return;
    }

    setHasResetOnce(true);
    if (currentUser) {
      currentUser.hasResetPassword = true;
    }
    toast.success('Password updated successfully! Single-use reset limit reached.');
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
  };

  const handleSave = () => {
    toast.success('Workspace preferences saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage appearance themes, password security, notification preferences, and region.
        </p>
      </div>

      {/* Single-Use Reset Password Section */}
      <Card className="p-6 border border-zinc-200/80 dark:border-zinc-800/80">
        <CardHeader className="px-0 pt-0 pb-4 border-b border-zinc-200/60 dark:border-zinc-800/60 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-sm font-bold">Reset Password (Single Use Allowed)</CardTitle>
            </div>
            {hasResetOnce || currentUser.hasResetPassword ? (
              <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 text-[10px]">
                Reset Limit Reached (1/1 Used)
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/20 text-emerald-600 border-emerald-500/30 text-[10px]">
                1 Change Remaining
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs mt-1">
            Employees can change/reset password only once. Further changes require IT Administrator approval.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {hasResetOnce || currentUser.hasResetPassword ? (
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
                Password Reset Successfully Completed
              </div>
              <p className="text-muted-foreground">
                You have already executed your single-use password change. If you forget your password, contact your IT Lead or Super Admin ({currentUser.team} Team).
              </p>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-semibold text-foreground">Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Confirm new password"
                  className="mt-1 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
                  required
                />
              </div>

              <Button type="submit" className="ambizcon-gradient text-white shadow-glow text-xs gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Reset Password (1/1 Single Use)
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Theme Preference */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Sun className="h-4 w-4 text-amber-500" />
            Appearance Theme
          </CardTitle>
          <CardDescription className="text-xs">
            Choose between dark mode, light mode, or system default.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'light', label: 'Light Mode', icon: Sun },
              { id: 'dark', label: 'Dark Mode', icon: Moon },
              { id: 'system', label: 'System Theme', icon: Laptop },
            ].map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex flex-col items-center justify-center rounded-2xl border p-4 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-800 bg-background text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-5 w-5 mb-2" />
                  <span className="text-xs">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-500" />
            Language & Region
          </CardTitle>
          <CardDescription className="text-xs">
            Select your preferred display language for the TaskFlow UI.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full max-w-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background px-3 py-2 text-xs focus-ring"
          >
            <option value="English (US)">English (US)</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Bell className="h-4 w-4 text-purple-500" />
            Notifications
          </CardTitle>
          <CardDescription className="text-xs">
            Configure how you receive task updates and cross-team alerts.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-foreground">In-App Toast Alerts</p>
              <p className="text-[11px] text-muted-foreground">Receive real-time popups when assigned a task</p>
            </div>
            <input
              type="checkbox"
              checked={inAppNotifs}
              onChange={(e) => setInAppNotifs(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-zinc-200/60 dark:border-zinc-800/60">
            <div>
              <p className="text-xs font-semibold text-foreground">Email Notifications</p>
              <p className="text-[11px] text-muted-foreground">Receive daily task digest summaries</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="h-4 w-4 rounded accent-primary cursor-pointer"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gap-2">
          <Save className="h-4 w-4" />
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
