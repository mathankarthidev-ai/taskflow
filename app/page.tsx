import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Zap,
  KanbanSquare,
  Inbox,
  BarChart3,
  Users,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export const metadata = {
  title: 'TaskFlow | Production Internal Task Platform',
  description: 'Linear/Notion-inspired task management SaaS application built with Next.js 15, React 19, TypeScript, and MongoDB.',
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950 text-white overflow-hidden selection:bg-primary selection:text-white">
      {/* Background Glow Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-brand-500/20 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <header className="relative z-10 flex h-20 items-center justify-between px-6 md:px-12 max-w-7xl mx-auto border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-glow">
            <Zap className="h-6 w-6 fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            TaskFlow
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="outline" size="sm" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Sign In
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm" className="gap-1.5 shadow-glow">
              Launch App
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-4 py-1.5 text-xs text-zinc-300 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Production-Quality SaaS Architecture for Company Workspaces</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Streamline Cross-Team Tasks with <span className="bg-gradient-to-r from-brand-500 via-indigo-400 to-purple-400 bg-clip-text text-transparent">Precision</span>
        </h1>

        <p className="text-base md:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          TaskFlow gives Creative, Marketing, and Engineering teams a high-velocity workspace featuring drag-and-drop Kanban, incoming lead queues, real-time analytics, and role-based permissions.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-base rounded-2xl gap-2 shadow-glow">
              Sign In with Mock Google
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="h-12 px-8 text-base rounded-2xl border-zinc-800 text-zinc-300 hover:bg-zinc-800">
              Explore Demo Workspace
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 px-6 py-16 max-w-7xl mx-auto border-t border-zinc-800/60">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-white">Engineered for Production SaaS Excellence</h2>
          <p className="text-xs text-zinc-400">Linear & Notion inspired user experience with strict RBAC access controls</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 glass-panel space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <KanbanSquare className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Interactive Kanban Board</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Drag and drop tasks between To Do, In Progress, Review, Support, and Done columns with instant state updates.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 glass-panel space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Cross-Team Incoming Queue</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Members raise requests to another team's queue. Team Leads review, assign members, and accept into workspace.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/50 p-6 glass-panel space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Recharts Analytics & CSV</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Interactive bar, pie, and line charts tracking velocity, team productivity, priority breakdown, and CSV report export.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/60 py-8 px-6 text-center text-xs text-zinc-500">
        <p>TaskFlow SaaS Platform • Next.js 15 • React 19 • TypeScript • MongoDB Atlas • Framer Motion</p>
      </footer>
    </div>
  );
}
