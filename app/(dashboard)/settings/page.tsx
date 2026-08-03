'use client';

import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuthStore } from '@/store/useAuthStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Sun, Moon, Laptop, Globe, Bell, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const currentUser = useAuthStore((s) => s.currentUser);
  const [language, setLanguage] = useState('English (US)');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);

  if (!currentUser) return null;

  const handleSave = () => {
    toast.success('Workspace preferences saved successfully!');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Workspace Settings</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage appearance themes, notification preferences, and workspace language.
        </p>
      </div>

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
