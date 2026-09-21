'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { CompanyBranch } from '@/types';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  ShieldCheck,
  Mail,
  AlertCircle,
  Lock,
  Sun,
  Moon,
  Laptop,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [selectedBranch, setSelectedBranch] = useState<CompanyBranch>('Ambizcon - Australia');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput.toLowerCase().endsWith('@ambizcon.com')) {
      setErrorMsg('Access Restricted: Only @ambizcon.com email accounts are authorized.');
      toast.error('Invalid email domain. Use @ambizcon.com');
      return;
    }

    if (passwordInput !== 'Ambizcon@2026') {
      setErrorMsg('Incorrect Password. Please enter company password Ambizcon@2026.');
      toast.error('Incorrect password. Use Ambizcon@2026');
      return;
    }

    const success = await login(emailInput.trim());
    if (success) {
      const currentUser = useAuthStore.getState().currentUser;
      const isAdmin = currentUser?.role === 'Super Admin' || currentUser?.role === 'Admin';

      // Ambizcon Health - India is strictly restricted to Admin accounts
      if (selectedBranch === 'Ambizcon Health - India' && !isAdmin) {
        logout();
        setErrorMsg('Access Denied: Ambizcon Health - India is restricted to Administrator accounts only. Regular staff must select Ambizcon - Australia.');
        toast.error('Restricted: Ambizcon Health - India is for Admins only.');
        return;
      }

      setSelectedCompany(selectedBranch);
      toast.success('Signed in successfully!');
      if (currentUser?.role === 'Reception Staff') {
        router.push('/attendance');
      } else {
        router.push('/dashboard');
      }
    } else {
      setErrorMsg('Account not found in Ambizcon directory.');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 md:p-8 overflow-hidden bg-background text-foreground transition-colors selection:bg-brand-500 selection:text-white">
      {/* AMBIZCON Gradient Mesh Backdrop */}
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#086075]/20 via-[#2a8c82]/15 to-[#8b9e59]/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#2a8c82]/15 via-[#086075]/15 to-transparent blur-[100px] pointer-events-none" />

      {/* Top Appearance Toggle (Light / Dark Mode Switcher) */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-1 shadow-sm backdrop-blur-xl">
        <button
          onClick={() => setTheme('light')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            theme === 'light' ? 'bg-brand-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Light Mode"
        >
          <Sun className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            theme === 'dark' ? 'bg-brand-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Dark Mode"
        >
          <Moon className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            theme === 'system' ? 'bg-brand-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="System Default"
        >
          <Laptop className="h-4 w-4" />
        </button>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-lg space-y-8 my-8">
        {/* AMBIZCON Brand Header (Dynamic: Ambizcon Australia vs Ambizcon Health) */}
        <div className="text-center space-y-3">
          {selectedBranch === 'Ambizcon - Australia' ? (
            <div className="flex items-center justify-center gap-3.5">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white p-2 shadow-glow border border-amber-500/40 flex items-center justify-center">
                <img
                  src="/ambizcon-australia-icon.png"
                  alt="AMBIZCON Australia Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  AMBIZCON<span className="text-amber-500 dark:text-amber-400 font-bold ml-1.5">Australia</span>
                </h1>
                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest mt-1">
                  Brisbane HQ • Global Operations
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4">
              <img
                src="/ambizcon-logo.png"
                alt="AMBIZCON Health Logo"
                className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover shadow-glow border border-emerald-500/40"
              />
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  AMBIZCON<span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1.5">Health</span>
                </h1>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mt-1">
                  Beyond Marketing • Beyond Healthcare
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Main Glassmorphic Login Card */}
        <div className="rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card/90 p-6 md:p-8 shadow-2xl backdrop-blur-2xl glass-panel relative overflow-hidden">
          {/* Ambizcon Signature Gradient Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 ambizcon-gradient" />

          <div className="flex items-center justify-between pb-6 border-b border-zinc-200/60 dark:border-zinc-800/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Ambizcon Corporate Portal</h3>
                <p className="text-[11px] text-muted-foreground">Authorized Employee Authentication</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10 font-mono">
              @ambizcon.com
            </Badge>
          </div>

          {/* Email & Password Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4 pt-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  Select Company / Branch
                </label>
                {selectedBranch === 'Ambizcon Health - India' ? (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Admin Only
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    All Staff & Demos
                  </span>
                )}
              </div>
              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as CompanyBranch)}
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background py-3 pl-4 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-semibold"
                >
                  <option value="Ambizcon - Australia">🇦🇺 Ambizcon - Australia (Brisbane HQ • Staff & Demos)</option>
                  <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India (Admin Only)</option>
                </select>
              </div>
              {selectedBranch === 'Ambizcon Health - India' && (
                <div className="mt-2 p-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2 animate-fade">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>
                    <strong>Admin Notice:</strong> Ambizcon Health - India is strictly restricted to <strong>Super Admin & Admin</strong> accounts.
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Work Email (@ambizcon.com)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your ambizcon email"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background py-3 pl-4 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background py-3 pl-4 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all placeholder:text-muted-foreground/60"
                  required
                />
              </div>
            </div>

            {errorMsg && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1.5 font-medium">
                <AlertCircle className="h-3.5 w-3.5" />
                {errorMsg}
              </p>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-2xl font-bold gap-2 text-sm shadow-glow ambizcon-gradient hover:opacity-90 text-white">
              {isLoading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center space-y-1">
          <div className="font-extrabold text-sm tracking-tight text-foreground">
            {selectedBranch === 'Ambizcon - Australia' ? (
              <>AMBIZCON<span className="text-amber-500 dark:text-amber-400 ml-1">Australia</span></>
            ) : (
              <>AMBIZCON<span className="text-emerald-600 dark:text-emerald-400 ml-1">Health</span></>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {selectedBranch === 'Ambizcon - Australia' ? 'Brisbane HQ • Global Operations' : 'Beyond Marketing • Beyond Healthcare'}
          </div>
        </div>
      </div>
    </div>
  );
}
