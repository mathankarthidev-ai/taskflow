'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Share2, 
  Search, 
  Filter, 
  Users, 
  ExternalLink, 
  ShieldCheck, 
  MessageSquare, 
  PlusCircle, 
  Sparkles,
  MapPin,
  Flag,
  CheckCircle2
} from 'lucide-react';
import { LocalBizHeader } from '@/components/layout/LocalBizHeader';
import { LocalBizFooter } from '@/components/layout/LocalBizFooter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const DEMO_GROUPS = [
  {
    id: 'grp-01',
    name: 'Chennai IT Jobs & Freshers Hub',
    description: 'Active daily job postings for React, Node, Python, Java, DevOps and freshers hiring in OMR, Guindy and DLF IT park.',
    platform: 'WhatsApp',
    category: 'Jobs & Careers',
    city: 'Chennai',
    members: '1,024 members',
    verified: true,
    lastChecked: 'Active today',
    link: 'https://chat.whatsapp.com/demo-chennai-it-jobs',
  },
  {
    id: 'grp-02',
    name: 'Tamil Nadu MSME Business Network',
    description: 'B2B collaboration, raw material sourcing, GST queries, and wholesale trade discussions across Tamil Nadu.',
    platform: 'Telegram',
    category: 'Business & B2B',
    city: 'Chennai',
    members: '4,520 members',
    verified: true,
    lastChecked: 'Active 2h ago',
    link: 'https://t.me/demo_tn_business_network',
  },
  {
    id: 'grp-03',
    name: 'Anna Nagar & Kilpauk Community',
    description: 'Local neighborhood updates, blood donation emergencies, trusted local vendors, and events.',
    platform: 'WhatsApp',
    category: 'City & Locality',
    city: 'Chennai',
    members: '850 members',
    verified: true,
    lastChecked: 'Active 10m ago',
    link: 'https://chat.whatsapp.com/demo-anna-nagar-connect',
  },
  {
    id: 'grp-04',
    name: 'TNPSC & UPSC Aspirants Forum',
    description: 'Daily current affairs, study materials, mock test discussions, and syllabus guidance in English and Tamil.',
    platform: 'Telegram',
    category: 'Education & Exams',
    city: 'Chennai',
    members: '12,800 members',
    verified: true,
    lastChecked: 'Active today',
    link: 'https://t.me/demo_tnpsc_aspirants',
  },
  {
    id: 'grp-05',
    name: 'Chennai Startup Founders & Techies',
    description: 'Co-founders meetup, pitch practice, SaaS growth hacks, and angel investment insights.',
    platform: 'WhatsApp',
    category: 'Technology',
    city: 'Chennai',
    members: '1,012 members',
    verified: true,
    lastChecked: 'Active 1h ago',
    link: 'https://chat.whatsapp.com/demo-chennai-startups',
  },
  {
    id: 'grp-06',
    name: 'Coimbatore Industrial Fabricators',
    description: 'Pump manufacturers, lathe toolings, CNC operators, and engineering components discussions.',
    platform: 'Telegram',
    category: 'Business & B2B',
    city: 'Coimbatore',
    members: '2,900 members',
    verified: true,
    lastChecked: 'Active yesterday',
    link: 'https://t.me/demo_coimbatore_industrial',
  }
];

export default function GroupLinksPage() {
  const [platformFilter, setPlatformFilter] = React.useState('All');
  const [categoryFilter, setCategoryFilter] = React.useState('All');
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredGroups = DEMO_GROUPS.filter(g => {
    const matchesPlatform = platformFilter === 'All' || g.platform === platformFilter;
    const matchesCategory = categoryFilter === 'All' || g.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <LocalBizHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="bg-gradient-to-b from-emerald-950 via-teal-950 to-zinc-950 text-white py-14 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
            <Badge variant="success" className="px-3.5 py-1 text-xs">
              <Share2 className="w-3.5 h-3.5 mr-1" />
              India&apos;s Curated Community Directory
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Find the Right Groups. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">
                Connect With The Right Community.
              </span>
            </h1>

            <p className="max-w-xl mx-auto text-sm sm:text-base text-zinc-300">
              Discover verified WhatsApp and Telegram communities for Jobs, Business, Education, and City neighborhoods with anti-spam screening.
            </p>

            {/* Search */}
            <div className="max-w-xl mx-auto pt-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search groups by topic, city, or skill..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-24 rounded-full border border-zinc-700 bg-zinc-900/90 text-sm text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* FILTERS & GROUPS LISTING */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Platform:
              </span>
              {['All', 'WhatsApp', 'Telegram'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatformFilter(p)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    platformFilter === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-zinc-500 mr-1">Category:</span>
              {['All', 'Jobs & Careers', 'Business & B2B', 'Education & Exams', 'City & Locality'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCategoryFilter(c)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                    categoryFilter === c
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Group Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div
                key={group.id}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-md ${
                      group.platform === 'WhatsApp' 
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                    }`}>
                      {group.platform} Group
                    </span>
                    <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      {group.lastChecked}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                      {group.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {group.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="flex items-center gap-1 font-medium">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      {group.members}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                      {group.city}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <a
                    href={group.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
                  >
                    <span>Join {group.platform}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button 
                    title="Report inactive or spam link"
                    className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <LocalBizFooter />
    </div>
  );
}

function Clock({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
