'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Building2, 
  Layers, 
  MapPin, 
  Users, 
  CreditCard, 
  Inbox, 
  Database, 
  Settings, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Share2,
  Sliders,
  DollarSign
} from 'lucide-react';
import { LocalBizHeader } from '@/components/layout/LocalBizHeader';
import { LocalBizFooter } from '@/components/layout/LocalBizFooter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function LocalBizAdminDashboard() {
  const [activeTab, setActiveTab] = React.useState<'businesses' | 'categories' | 'locations' | 'enquiries' | 'database'>('businesses');
  const [statusFilter, setStatusFilter] = React.useState('all');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <LocalBizHeader />

      {/* Admin Top Subheader with Cross-Side Portal Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base text-zinc-900 dark:text-white">
                  Local Biz Management Console
                </h1>
                <Badge variant="info" className="text-[10px]">Admin</Badge>
              </div>
              <p className="text-xs text-zinc-500">
                Directory Moderation, Chennai Locations, RBAC, and Supabase Engine
              </p>
            </div>
          </div>

          {/* Cross-Side Coming: Biz to Group, Group to Biz */}
          <div className="flex items-center gap-2.5">
            <Link href="/groups">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 gap-1.5 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Switch to Group Links Portal</span>
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'businesses'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Businesses & Approvals</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'categories'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Categories (60+)</span>
          </button>

          <button
            onClick={() => setActiveTab('locations')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'locations'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Chennai Localities</span>
          </button>

          <button
            onClick={() => setActiveTab('enquiries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'enquiries'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Lead Enquiries</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              activeTab === 'database'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Database & Supabase Setup</span>
          </button>
        </div>

        {/* TAB 1: BUSINESSES */}
        {activeTab === 'businesses' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500">Filter Status:</span>
                {['all', 'published', 'pending_approval', 'claimed'].map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium capitalize ${
                      statusFilter === s ? 'bg-blue-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <Link href="/list-your-business">
                <Button size="sm" className="bg-blue-600 text-white rounded-xl text-xs">
                  + Add Business Listing
                </Button>
              </Link>
            </div>

            <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Business Name</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Locality</th>
                    <th className="p-3.5">Plan</th>
                    <th className="p-3.5">Verification</th>
                    <th className="p-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-white">
                      Chennai Cool Care AC Services
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">AC Repair & Service</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">T. Nagar (600017)</td>
                    <td className="p-3.5"><Badge variant="info">Growth</Badge></td>
                    <td className="p-3.5"><Badge variant="success">Verified</Badge></td>
                    <td className="p-3.5">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px]">
                        Edit
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-white">
                      Mylapore Heritage Electricians
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Electricians</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Mylapore (600004)</td>
                    <td className="p-3.5"><Badge variant="default">Basic</Badge></td>
                    <td className="p-3.5"><Badge variant="success">Verified</Badge></td>
                    <td className="p-3.5">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px]">
                        Edit
                      </Button>
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                    <td className="p-3.5 font-bold text-zinc-900 dark:text-white">
                      Velachery Express Plumbing Works
                    </td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Plumbers</td>
                    <td className="p-3.5 text-zinc-600 dark:text-zinc-400">Velachery (600042)</td>
                    <td className="p-3.5"><Badge variant="secondary">Free</Badge></td>
                    <td className="p-3.5"><Badge variant="warning">Phone Verified</Badge></td>
                    <td className="p-3.5">
                      <Button variant="outline" size="sm" className="rounded-lg h-7 text-[11px]">
                        Edit
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Bilingual Taxonomy</h3>
                <p className="text-xs text-zinc-500">60+ structured categories with English and Tamil terminology</p>
              </div>
              <Badge variant="info">60 Active Categories</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { en: 'AC Repair & Service', ta: 'ஏசி பழுதுபார்த்தல்', slug: 'ac-repair-service', count: 148 },
                { en: 'Electricians', ta: 'மின்சார பணியாளர்கள்', slug: 'electricians', count: 230 },
                { en: 'Plumbers', ta: 'குழாய் பழுதுபார்ப்பவர்கள்', slug: 'plumbers', count: 195 },
                { en: 'Dental Clinics', ta: 'பல் மருத்துவமனைகள்', slug: 'dental-clinics', count: 112 },
                { en: 'Packers & Movers', ta: 'பேக்கர்ஸ் மற்றும் மூவர்ஸ்', slug: 'packers-movers', count: 84 },
                { en: 'Car Mechanics', ta: 'கார் பழுதுபார்ப்பு', slug: 'car-repair-service', count: 160 },
                { en: 'CNC Machining & Fabricators', ta: 'இயந்திர பாகங்கள் தயாரிப்பு', slug: 'cnc-machining-fabricators', count: 75 },
                { en: 'Chartered Accountants', ta: 'பட்டய கணக்காளர்கள்', slug: 'chartered-accountants', count: 92 },
                { en: 'Organic Grocery Stores', ta: 'இயற்கை அங்காடிகள்', slug: 'organic-grocery-stores', count: 130 }
              ].map(cat => (
                <div key={cat.slug} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-white">{cat.en}</h4>
                    <p className="text-[11px] text-zinc-500">{cat.ta}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-semibold text-zinc-600 dark:text-zinc-400">
                    {cat.count} listings
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LOCATIONS */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Chennai Locality Directory</h3>
                <p className="text-xs text-zinc-500">Postal codes and geographical areas configured in Tamil Nadu</p>
              </div>
              <Badge variant="success">Chennai, Tamil Nadu (India)</Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {[
                { name: 'T. Nagar', pin: '600017', ta: 'தி. நகர்' },
                { name: 'Adyar', pin: '600020', ta: 'அடையாறு' },
                { name: 'Velachery', pin: '600042', ta: 'வேளச்சேரி' },
                { name: 'Anna Nagar', pin: '600040', ta: 'அண்ணா நகர்' },
                { name: 'Mylapore', pin: '600004', ta: 'மயிலாப்பூர்' },
                { name: 'Guindy', pin: '600032', ta: 'கிண்டி' },
                { name: 'Nungambakkam', pin: '600034', ta: 'நுங்கம்பாக்கம்' },
                { name: 'Tambaram', pin: '600045', ta: 'தாம்பரம்' },
                { name: 'Porur', pin: '600116', ta: 'போரூர்' },
                { name: 'OMR - Sholinganallur', pin: '600119', ta: 'சோழிங்கநல்லூர்' },
                { name: 'Chromepet', pin: '600044', ta: 'குரோம்பேட்டை' },
                { name: 'Vadapalani', pin: '600026', ta: 'வடபழனி' }
              ].map(loc => (
                <div key={loc.pin} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white">{loc.name}</span>
                    <span className="font-mono text-[10px] text-zinc-400">{loc.pin}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500">{loc.ta}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ENQUIRIES */}
        {activeTab === 'enquiries' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white">Customer Leads & Enquiries</h3>
                <p className="text-xs text-zinc-500">Track real lead conversions with customer consent timestamps</p>
              </div>
              <Badge variant="info">3 Active Leads Today</Badge>
            </div>

            <div className="space-y-3">
              {[
                { customer: 'Ramesh Kumar', phone: '+91 98400 12345', biz: 'Chennai Cool Care AC Services', service: 'Split AC Gas Refill', locality: 'T. Nagar', time: '12 mins ago', status: 'delivered' },
                { customer: 'Priya Sundaram', phone: '+91 97900 87654', biz: 'Anna Nagar Dental Care', service: 'Invisalign Aligners Consultation', locality: 'Anna Nagar', time: '1 hour ago', status: 'viewed' },
                { customer: 'Senthil Nathan', phone: '+91 94441 55667', biz: 'Mylapore Heritage Electricians', service: 'Inverter & MCB Installation', locality: 'Mylapore', time: '3 hours ago', status: 'contacted' }
              ].map((enq, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-zinc-900 dark:text-white">{enq.customer}</span>
                      <span className="text-zinc-500 font-mono">({enq.phone})</span>
                      <Badge variant="success" className="text-[10px] capitalize">{enq.status}</Badge>
                    </div>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      Requirement: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{enq.service}</span> • Assigned to: <span className="text-blue-600 font-medium">{enq.biz}</span>
                    </p>
                  </div>
                  <div className="text-zinc-400 text-[11px] sm:text-right">
                    <span>{enq.locality}</span> • <span>{enq.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: DATABASE & SUPABASE SETUP */}
        {activeTab === 'database' && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white">
                    Supabase PostgreSQL Connection Status
                  </h3>
                </div>
                <Badge variant="success">Configured & Active</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <span className="font-semibold text-zinc-500">Project Endpoint</span>
                  <p className="font-mono text-zinc-800 dark:text-zinc-200 break-all">
                    https://ekdrfcopnnuaargnusav.supabase.co
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                  <span className="font-semibold text-zinc-500">Security Architecture</span>
                  <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                    Row Level Security (RLS) Active on 25+ Tables
                  </p>
                </div>
              </div>

              {/* Versioned Migrations Check */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-white uppercase tracking-wider">
                  Versioned Database Migrations in Repository
                </h4>
                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-800 dark:text-zinc-200">20261010_001_initial_schema.sql</span>
                    <span className="text-zinc-400 ml-auto">Core Relational Tables</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-800 dark:text-zinc-200">20261010_002_rls_policies.sql</span>
                    <span className="text-zinc-400 ml-auto">7-Role Security Policies</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-zinc-800 dark:text-zinc-200">20261010_003_seed_data.sql</span>
                    <span className="text-zinc-400 ml-auto">Chennai Localities & 60+ Categories</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <LocalBizFooter />
    </div>
  );
}
