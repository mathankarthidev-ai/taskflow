'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Check, 
  Sparkles, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight,
  Zap,
  Building2
} from 'lucide-react';
import { LocalBizHeader } from '@/components/layout/LocalBizHeader';
import { LocalBizFooter } from '@/components/layout/LocalBizFooter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PLANS = [
  {
    name: 'Free',
    slug: 'free',
    badge: 'Starter',
    monthlyPrice: 0,
    annualPrice: 0,
    description: 'Perfect for small local tradespeople and neighbourhood shops getting started.',
    features: [
      'Basic public listing in Chennai directory',
      'Up to 3 photo uploads',
      'Single primary category listing',
      'Direct customer phone call & WhatsApp button',
      'Basic monthly views counter',
      'Standard customer review collection',
    ],
    ctaText: 'Create Free Listing',
    highlighted: false,
  },
  {
    name: 'Basic',
    slug: 'basic',
    badge: 'Popular for Shops',
    monthlyPrice: 999,
    annualPrice: 9990,
    description: 'Build local credibility with verification badges and instant lead notifications.',
    features: [
      'Everything in Free',
      'Official "Verified Business" badge',
      'Up to 10 photo uploads & showroom gallery',
      'Up to 3 relevant categories',
      'Customer enquiry lead inbox',
      'Instant SMS & Email enquiry notifications',
      '30-day profile analytics & search appearances',
    ],
    ctaText: 'Get Started with Basic',
    highlighted: false,
  },
  {
    name: 'Growth',
    slug: 'growth',
    badge: 'Most Popular',
    monthlyPrice: 1999,
    annualPrice: 19990,
    description: 'Maximize incoming leads with priority placement and rich catalogue showcases.',
    features: [
      'Everything in Basic',
      'Priority local search ranking in your area',
      'Up to 25 products & services catalogue items',
      'Instant WhatsApp lead alert routing',
      'Eligible for "Sponsored / Featured" carousel',
      '90-day comprehensive analytics & conversion funnels',
      'Direct website link & Google Maps directions',
    ],
    ctaText: 'Choose Growth Plan',
    highlighted: true,
  },
  {
    name: 'Professional',
    slug: 'professional',
    badge: 'Enterprise MSME',
    monthlyPrice: 2999,
    annualPrice: 29990,
    description: 'Dominant local visibility for clinics, established showrooms and B2B manufacturers.',
    features: [
      'Everything in Growth',
      'Top-ranked sponsored placement across Chennai',
      'Unlimited photos & full digital catalogue',
      'Dedicated local account manager (Chennai)',
      'Advanced competitor and keyword discovery trends',
      'Lead export to Excel / CRM webhook',
      'Zero lead enquiry dispute fees & priority support',
    ],
    ctaText: 'Contact for Enterprise',
    highlighted: false,
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = React.useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <LocalBizHeader />

      <main className="flex-1 py-14 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <Badge variant="info" className="px-3 py-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Transparent Indian Pricing
            </Badge>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
              Simple, Predictable Plans For Every Local Business
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
              Free listings are always free. Upgrade when you need higher search rankings, verified trust badges, and direct WhatsApp customer leads.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 p-1 rounded-full bg-zinc-200/80 dark:bg-zinc-800 text-xs font-semibold pt-2">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-4 py-2 rounded-full transition-all ${
                  !isAnnual ? 'bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-white' : 'text-zinc-500'
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-4 py-2 rounded-full transition-all flex items-center gap-1.5 ${
                  isAnnual ? 'bg-blue-600 text-white shadow-sm' : 'text-zinc-500'
                }`}
              >
                <span>Annual Billing</span>
                <span className="text-[10px] bg-amber-400 text-zinc-950 px-1.5 py-0.5 rounded-full font-bold">
                  Save 2 Months
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <div
                  key={plan.slug}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all ${
                    plan.highlighted
                      ? 'bg-gradient-to-b from-blue-900 to-indigo-950 text-white border-2 border-blue-500 shadow-xl shadow-blue-900/20 scale-[1.02]'
                      : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        plan.highlighted 
                          ? 'bg-blue-500/30 text-blue-200 border border-blue-400/30'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {plan.badge}
                      </span>
                      {plan.highlighted && (
                        <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 fill-amber-300" /> Best Value
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="font-extrabold text-xl">{plan.name}</h3>
                      <p className={`text-xs mt-1 leading-relaxed ${plan.highlighted ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {plan.description}
                      </p>
                    </div>

                    {/* Price display */}
                    <div className="pt-2">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">₹{price.toLocaleString('en-IN')}</span>
                        <span className={`text-xs ${plan.highlighted ? 'text-zinc-300' : 'text-zinc-500'}`}>
                          /{isAnnual ? 'year' : 'month'}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${plan.highlighted ? 'text-blue-200' : 'text-zinc-400'}`}>
                        {price === 0 ? 'Forever free of charge' : '+ 18% GST applicable'}
                      </p>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs pt-4 border-t border-zinc-100 dark:border-zinc-800">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            plan.highlighted ? 'text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                          }`} />
                          <span className={plan.highlighted ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6">
                    <Link href={`/list-your-business?plan=${plan.slug}`}>
                      <Button
                        className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                          plan.highlighted
                            ? 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-md'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {plan.ctaText}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Trust Banner */}
          <div className="rounded-2xl p-6 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                  Payment Security via Razorpay India
                </h4>
                <p className="text-zinc-600 dark:text-zinc-400">
                  All credit cards, debit cards, NetBanking, and UPI (Google Pay, PhonePe, Paytm) supported with automated GST invoices.
                </p>
              </div>
            </div>
            <Link href="/contact">
              <Button variant="outline" size="sm" className="rounded-xl border-blue-300 dark:border-blue-800">
                Talk to Sales (Chennai)
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <LocalBizFooter />
    </div>
  );
}
