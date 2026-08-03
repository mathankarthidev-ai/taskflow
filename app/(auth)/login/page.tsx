'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { SEED_USERS } from '@/lib/seed-data';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Zap,
  ArrowRight,
  ShieldCheck,
  Mail,
  AlertCircle,
  Sparkles,
  Bot,
  Cpu,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const router = useRouter();

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!emailInput.toLowerCase().endsWith('@taskflow.company')) {
      setErrorMsg('Access Restricted: Only @taskflow.company email accounts are authorized.');
      toast.error('Invalid email domain. Use @taskflow.company');
      return;
    }

    const success = await login(emailInput.trim());
    if (success) {
      toast.success('Signed in successfully!');
      router.push('/dashboard');
    } else {
      setErrorMsg('User not found. Select a pre-seeded persona below.');
    }
  };

  const handleSelectPersona = async (email: string) => {
    setErrorMsg('');
    const success = await login(email);
    if (success) {
      toast.success(`Signed in as ${email}`);
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 md:p-8 overflow-hidden bg-zinc-950 text-white selection:bg-brand-500 selection:text-white">
      {/* AI Mesh & Animated Glowing Orbs */}
      <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-gradient-to-tr from-brand-600/20 via-indigo-600/20 to-purple-600/10 blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-emerald-500/15 via-blue-600/15 to-transparent blur-[100px] pointer-events-none" />

      {/* Grid Overlay Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-2xl space-y-8 my-8">
        {/* Brand Header with AI Badge */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-300 backdrop-blur-md shadow-glow">
            <Bot className="h-4 w-4 text-brand-400 animate-bounce" />
            <span>TaskFlow AI Workspace Agent v2.5 Active</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-500 to-purple-500 text-white shadow-glow">
              <Zap className="h-7 w-7 fill-current" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              TaskFlow
            </h1>
          </div>

          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            AI-Driven Internal SaaS Task Operations & Cross-Team Workflow Engine
          </p>
        </div>

        {/* Main Glassmorphic Login Card */}
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/70 p-6 md:p-8 shadow-2xl backdrop-blur-2xl glass-panel relative overflow-hidden">
          {/* Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500" />

          <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Google OAuth Workspace Gateway</h3>
                <p className="text-[11px] text-zinc-400">Restricted Company Authentication</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs text-brand-400 border-brand-500/40 bg-brand-500/10 font-mono">
              @taskflow.company
            </Badge>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleCustomLogin} className="space-y-4 pt-6">
            <div>
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-brand-400" />
                Enter TaskFlow Company Email
              </label>
              <div className="relative mt-1.5">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="alex@taskflow.company"
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 py-3 pl-4 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all placeholder:text-zinc-600"
                  required
                />
              </div>
              {errorMsg && (
                <p className="mt-2 text-xs text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errorMsg}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-2xl font-bold gap-2 text-sm shadow-glow bg-brand-600 hover:bg-brand-500 text-white">
              {isLoading ? 'Authenticating with Google...' : 'Sign In with Mock Google'}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-zinc-800/80" />
            </div>
            <span className="relative bg-zinc-900/90 px-4 text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
              Or Select Persona for 1-Click Instant Login
            </span>
          </div>

          {/* 7 Seed Personas Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {SEED_USERS.map((persona) => {
              const isLead = persona.role === 'Team Lead';
              const isAdmin = persona.role === 'Super Admin';
              const teamColor =
                persona.team === 'Creative'
                  ? 'border-purple-500/30 text-purple-400 bg-purple-500/10'
                  : persona.team === 'Marketing'
                  ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                  : 'border-blue-500/30 text-blue-400 bg-blue-500/10';

              return (
                <button
                  key={persona.email}
                  onClick={() => handleSelectPersona(persona.email)}
                  className="flex items-center justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-3 hover:bg-zinc-800/80 hover:border-brand-500/50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={persona.avatar} name={persona.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white group-hover:text-brand-400 transition-colors truncate">
                        {persona.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 truncate">{persona.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge
                      variant={isAdmin ? 'danger' : isLead ? 'warning' : 'outline'}
                      className="text-[9px] px-1.5 py-0"
                    >
                      {persona.role}
                    </Badge>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${teamColor}`}>
                      {persona.team}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer info */}
        <div className="flex flex-wrap items-center justify-between text-xs text-zinc-500 gap-2 px-2">
          <span>TaskFlow Enterprise SaaS</span>
          <div className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-brand-400" />
            <span>Next.js 15 • MongoDB Atlas • AI Workflows</span>
          </div>
        </div>
      </div>
    </div>
  );
}
