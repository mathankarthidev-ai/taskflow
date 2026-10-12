'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  PlusCircle, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { LocalBizHeader } from '@/components/layout/LocalBizHeader';
import { LocalBizFooter } from '@/components/layout/LocalBizFooter';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/Badge';

export default function ListYourBusinessPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [businessName, setBusinessName] = React.useState('');
  const [category, setCategory] = React.useState('AC Repair & Service');
  const [locality, setLocality] = React.useState('T. Nagar');
  const [phone, setPhone] = React.useState('');
  const [contactName, setContactName] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <LocalBizHeader />

      <main className="flex-1 py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <Badge variant="success" className="text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              100% Free Initial Listing
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              List Your Business on Local Biz
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
              Get discovered by thousands of customers looking for services and products across Chennai and Tamil Nadu.
            </p>
          </div>

          <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Listing Submitted Successfully!
                </h2>
                <p className="text-xs text-zinc-500 max-w-md mx-auto">
                  Thank you, <span className="font-semibold">{contactName}</span>. Your business <span className="font-semibold">&quot;{businessName}&quot;</span> in {locality} has been received for verification. Our Chennai onboarding team will call you within 24 hours.
                </p>
                <div className="pt-4 flex justify-center gap-3">
                  <Link href="/local-biz">
                    <Button className="bg-blue-600 text-white rounded-xl text-xs">
                      Back to Homepage
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => { setSubmitted(false); setBusinessName(''); setPhone(''); }}
                    className="rounded-xl text-xs"
                  >
                    Add Another Business
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-medium text-zinc-700 dark:text-zinc-300">
                    Business / Shop / Company Name *
                  </label>
                  <Input
                    required
                    placeholder="e.g. Chennai Cool Care AC Services"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Primary Business Category *
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="AC Repair & Service">AC Repair & Service</option>
                      <option value="Electricians">Electricians</option>
                      <option value="Plumbers">Plumbers</option>
                      <option value="Dental Clinics">Dental Clinics</option>
                      <option value="Packers & Movers">Packers & Movers</option>
                      <option value="Car Repair & Service">Car Mechanics</option>
                      <option value="House Painters">House Painters</option>
                      <option value="CNC Machining & Fabricators">CNC Machining & Fabricators</option>
                      <option value="Chartered Accountants">Chartered Accountants</option>
                      <option value="Organic Grocery Stores">Organic Grocery Stores</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Chennai Locality / Area *
                    </label>
                    <select
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      className="w-full mt-1 h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 text-zinc-900 dark:text-zinc-100"
                    >
                      <option value="T. Nagar">T. Nagar (600017)</option>
                      <option value="Adyar">Adyar (600020)</option>
                      <option value="Velachery">Velachery (600042)</option>
                      <option value="Anna Nagar">Anna Nagar (600040)</option>
                      <option value="Mylapore">Mylapore (600004)</option>
                      <option value="Guindy">Guindy (600032)</option>
                      <option value="Tambaram">Tambaram (600045)</option>
                      <option value="Porur">Porur (600116)</option>
                      <option value="OMR - Sholinganallur">OMR - Sholinganallur (600119)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Business Contact Phone / Mobile *
                    </label>
                    <Input
                      type="tel"
                      required
                      placeholder="e.g. 98401 23456"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="font-medium text-zinc-700 dark:text-zinc-300">
                      Contact Person / Owner Name *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Kumar"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
                  <Button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md text-xs"
                  >
                    Submit Business Listing
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      <LocalBizFooter />
    </div>
  );
}
