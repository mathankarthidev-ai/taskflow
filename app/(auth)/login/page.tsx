'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useCompanyStore } from '@/store/useCompanyStore';
import { CompanyBranch } from '@/types';
import { isUserInCompany } from '@/lib/company-filter';
import { getUserByEmailAction } from '@/actions/userActions';
import { supabase } from '@/lib/supabase';
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
  const [selectedBranch, setSelectedBranch] = useState<CompanyBranch>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('ambizcon_selected_company');
      if (stored === 'Ambizcon') return 'Ambizcon';
    }
    return 'Ambizcon Health - India';
  });
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const isLoading = useAuthStore((s) => s.isLoading);
  const setSelectedCompany = useCompanyStore((s) => s.setSelectedCompany);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const isAustralia = selectedBranch === 'Ambizcon';

  // Synchronize document attribute and storage when selected branch toggles
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-company', isAustralia ? 'ambizcon' : 'ambizcon-health');
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('ambizcon_selected_company', selectedBranch);
      } catch (e) {}
    }
  }, [selectedBranch, isAustralia]);

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Parse any callback error redirect parameters
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'domain_restricted') {
      setErrorMsg('Access Restricted: Only official @ambizcon.com Google Workspace accounts are authorized.');
      toast.error('Domain restricted to @ambizcon.com');
    } else if (err === 'branch_mismatch') {
      const reg = params.get('registered') || '';
      const sel = params.get('selected') || '';
      setErrorMsg(`Don't have account in ${sel}. This account is registered under ${reg}. Please switch branch to log in.`);
      toast.error(`Don't have account in ${sel}`);
    } else if (err === 'not_registered') {
      setErrorMsg("Don't have account in Ambizcon directory. Please contact your administrator.");
      toast.error('Account not registered in directory');
    } else if (err === 'auth_failed') {
      setErrorMsg('Google Sign-In was cancelled or could not be completed.');
    }
  }, []);

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setIsGoogleLoading(true);

    try {
      const redirectTo = `${window.location.origin}/auth/callback?branch=${encodeURIComponent(selectedBranch)}`;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
            hd: 'ambizcon.com', // Enforce company domain picker
          },
        },
      });

      if (error) {
        toast.info(
          'Google Sign-In is active! Paste your Google OAuth Client ID & Secret in your Supabase Auth dashboard to enable live Google accounts.',
          { duration: 7000 }
        );
      }
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      toast.error(err?.message || 'Failed to initialize Google Sign-In');
    } finally {
      setIsGoogleLoading(false);
    }
  };

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

    // 1. Fetch user from Ambizcon directory first
    const user = await getUserByEmailAction(emailInput.trim());
    if (!user) {
      setErrorMsg("Don't have account in Ambizcon directory.");
      toast.error('Account not found in directory');
      return;
    }

    // 2. Strict Cross-Branch Isolation Check BEFORE login
    const isSuperAdmin = user.role === 'Super Admin' || user.role === 'Admin';
    const belongsToBranch = isUserInCompany(user, selectedBranch);

    if (!belongsToBranch && !isSuperAdmin) {
      const selectedLabel = selectedBranch === 'Ambizcon' ? 'Ambizcon (Brisbane HQ)' : 'Ambizcon Health - India (Chennai HQ)';
      const registeredLabel = user.company === 'Ambizcon' ? 'Ambizcon (Brisbane HQ)' : 'Ambizcon Health - India (Chennai HQ)';
      setErrorMsg(`Don't have account in ${selectedLabel}. This account is registered under ${registeredLabel}. Please switch branch to log in.`);
      toast.error(`Don't have account in ${selectedBranch === 'Ambizcon' ? 'Ambizcon Australia' : 'Ambizcon Health India'}`);
      return;
    }

    // 3. Complete authentication session
    const success = await login(emailInput.trim());
    if (success) {
      setSelectedCompany(selectedBranch);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-company', selectedBranch === 'Ambizcon' ? 'ambizcon' : 'ambizcon-health');
      }
      toast.success(`Signed in to ${selectedBranch}!`);
      router.push('/dashboard');
    } else {
      setErrorMsg("Don't have account in Ambizcon directory.");
      toast.error('Account not found in directory');
    }
  };

  return (
    <div className={`relative flex min-h-screen items-center justify-center p-4 md:p-8 overflow-hidden bg-background text-foreground transition-colors ${
      isAustralia ? 'selection:bg-sky-500 selection:text-white' : 'selection:bg-brand-500 selection:text-white'
    }`}>
      {/* AMBIZCON Dynamic Gradient Mesh Backdrop */}
      {isAustralia ? (
        <>
          <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#0284C7]/25 via-[#0369A1]/20 to-[#EA580C]/20 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#EA580C]/20 via-[#F7931E]/15 to-transparent blur-[100px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-[#086075]/20 via-[#2a8c82]/15 to-[#8b9e59]/10 blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#2a8c82]/15 via-[#086075]/15 to-transparent blur-[100px] pointer-events-none" />
        </>
      )}

      {/* Top Appearance Toggle (Light / Dark Mode Switcher) */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-1 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-card p-1 shadow-sm backdrop-blur-xl">
        <button
          onClick={() => setTheme('light')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            theme === 'light' ? 'ambizcon-gradient text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Light Mode"
        >
          <Sun className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('dark')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            theme === 'dark' ? 'ambizcon-gradient text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
          title="Dark Mode"
        >
          <Moon className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme('system')}
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
            theme === 'system' ? 'ambizcon-gradient text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
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
          {selectedBranch === 'Ambizcon' ? (
            <div className="flex items-center justify-center gap-3.5">
              <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-white p-2 shadow-glow border border-amber-500/40 flex items-center justify-center">
                <img
                  src="/ambizcon-australia-icon.png"
                  alt="AMBIZCON Logo"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
                  AMBIZCON
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
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                isAustralia
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Ambizcon Corporate Portal</h3>
                <p className="text-[11px] text-muted-foreground">Authorized Employee Authentication</p>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs font-mono transition-colors ${
              isAustralia
                ? 'text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10'
                : 'text-emerald-600 dark:text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
            }`}>
              @ambizcon.com
            </Badge>
          </div>

          {/* Email & Password Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4 pt-6">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Building2 className={`h-3.5 w-3.5 ${isAustralia ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                  Select Company / Branch
                </label>
                <span className="text-[10px] font-medium text-muted-foreground">
                  {selectedBranch === 'Ambizcon Health - India' ? 'Chennai HQ' : 'Brisbane HQ'}
                </span>
              </div>
              <div className="relative">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as CompanyBranch)}
                  className={`w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background py-3 pl-4 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 transition-all font-semibold ${
                    isAustralia
                      ? 'focus:ring-sky-500/50 focus:border-sky-500'
                      : 'focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                >
                  <option value="Ambizcon Health - India">🇮🇳 Ambizcon Health - India (Chennai HQ)</option>
                  <option value="Ambizcon">🇦🇺 Ambizcon (Brisbane HQ)</option>
                </select>
              </div>
            </div>

            {/* Google Sign-In Primary Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background hover:bg-zinc-50 dark:hover:bg-zinc-900 text-foreground font-bold text-sm shadow-sm transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                title="Sign in with your @ambizcon.com Google Workspace account"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isGoogleLoading ? 'Connecting Google Workspace...' : 'Sign in with Google Workspace'}</span>
              </button>

              <div className="relative flex py-3 items-center">
                <div className="flex-grow border-t border-zinc-200/60 dark:border-zinc-800/60" />
                <span className="flex-shrink mx-3 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                  or sign in with password
                </span>
                <div className="flex-grow border-t border-zinc-200/60 dark:border-zinc-800/60" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className={`h-3.5 w-3.5 ${isAustralia ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                Work Email (@ambizcon.com)
              </label>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="your ambizcon email"
                  className={`w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background py-3 pl-4 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 transition-all placeholder:text-muted-foreground/60 ${
                    isAustralia
                      ? 'focus:ring-sky-500/50 focus:border-sky-500'
                      : 'focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className={`h-3.5 w-3.5 ${isAustralia ? 'text-sky-600 dark:text-sky-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                Password
              </label>
              <div className="relative mt-1.5">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter password"
                  className={`w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-background py-3 pl-4 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 transition-all placeholder:text-muted-foreground/60 ${
                    isAustralia
                      ? 'focus:ring-sky-500/50 focus:border-sky-500'
                      : 'focus:ring-emerald-500/50 focus:border-emerald-500'
                  }`}
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
            {selectedBranch === 'Ambizcon' ? (
              <>AMBIZCON</>
            ) : (
              <>AMBIZCON<span className="text-emerald-600 dark:text-emerald-400 ml-1">Health</span></>
            )}
          </div>
          <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {selectedBranch === 'Ambizcon' ? 'Brisbane HQ • Global Operations' : 'Beyond Marketing • Beyond Healthcare'}
          </div>
        </div>
      </div>
    </div>
  );
}
