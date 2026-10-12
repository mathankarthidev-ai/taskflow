'use client';

import * as React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Search, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Briefcase,
  Wrench,
  Zap,
  Wind,
  Smile,
  Truck,
  CarFront,
  Paintbrush,
  Clock,
  ExternalLink,
  PlusCircle,
  HelpCircle,
  ChevronRight,
  Filter
} from 'lucide-react';
import { LocalBizHeader } from '@/components/layout/LocalBizHeader';
import { LocalBizFooter } from '@/components/layout/LocalBizFooter';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// Verified Demo Businesses for Chennai Market
const FEATURED_BUSINESSES = [
  {
    id: 'biz-01',
    name: 'Chennai Cool Care AC Services',
    slug: 'chennai-cool-care-ac-services',
    tagline: 'Prompt Split & Ductable AC Repairs, Gas Charging & Cleaning',
    category: 'AC Repair & Service',
    locality: 'T. Nagar',
    city: 'Chennai',
    rating: 4.8,
    reviews: 142,
    phone: '+91 98401 23456',
    whatsapp: '919840123456',
    timing: 'Open Now (8:00 AM - 9:00 PM)',
    verified: true,
    featured: true,
    badges: ['Phone Verified', 'GST Registered', 'Sponsor'],
    priceRange: '₹399 - ₹2,499',
    services: ['AC Deep Chemical Wash', 'Gas Refill (R32/R410A)', 'PCB Circuit Repair', 'Uninstallation'],
  },
  {
    id: 'biz-02',
    name: 'Mylapore Heritage Electricians',
    slug: 'mylapore-heritage-electricians',
    tagline: 'Licensed Class-A Master Electricians & Emergency Power Backup',
    category: 'Electricians',
    locality: 'Mylapore',
    city: 'Chennai',
    rating: 4.9,
    reviews: 98,
    phone: '+91 94440 98765',
    whatsapp: '919444098765',
    timing: '24/7 Emergency Service',
    verified: true,
    featured: true,
    badges: ['Licensed Wireman', 'Document Verified'],
    priceRange: '₹250 - ₹1,500',
    services: ['Short Circuit Troubleshooting', 'Distribution Box / MCB Upgrade', 'Inverter Wiring'],
  },
  {
    id: 'biz-03',
    name: 'Velachery Express Plumbing Works',
    slug: 'velachery-express-plumbing-works',
    tagline: 'Motor Pump Repairs, Drain Unclogging & Concealed Pipe Fixing',
    category: 'Plumbers',
    locality: 'Velachery',
    city: 'Chennai',
    rating: 4.7,
    reviews: 86,
    phone: '+91 98845 11223',
    whatsapp: '919884511223',
    timing: 'Open Now (7:30 AM - 8:30 PM)',
    verified: true,
    featured: false,
    badges: ['Verified Local Pro'],
    priceRange: '₹300 - ₹3,000',
    services: ['Overhead Tank Cleaning', 'Bathroom Tap & Diverter Fixing', 'Submersible Pump Repair'],
  },
  {
    id: 'biz-04',
    name: 'Anna Nagar Dental Care & Implants',
    slug: 'anna-nagar-dental-care-implants',
    tagline: 'Modern Laser Dentistry, Painless Root Canals & Aligners',
    category: 'Dental Clinics',
    locality: 'Anna Nagar',
    city: 'Chennai',
    rating: 4.9,
    reviews: 215,
    phone: '+91 44 2626 5500',
    whatsapp: '914426265500',
    timing: 'Open Now (9:00 AM - 8:00 PM)',
    verified: true,
    featured: true,
    badges: ['NABH Accredited', 'Doctor Verified'],
    priceRange: '₹500 consultation',
    services: ['Single-Sitting Root Canal', 'Teeth Whitening', 'Invisible Aligners', 'Pediatric Care'],
  },
  {
    id: 'biz-05',
    name: 'OMR Precision Tech & Toolings',
    slug: 'omr-precision-tech-toolings',
    tagline: 'ISO 9001:2015 CNC Lathe Components & Industrial Fabrication',
    category: 'CNC Machining & Fabricators',
    locality: 'Sholinganallur',
    city: 'Chennai',
    rating: 4.9,
    reviews: 64,
    phone: '+91 99620 44332',
    whatsapp: '919962044332',
    timing: 'Mon - Sat (8:30 AM - 6:30 PM)',
    verified: true,
    featured: false,
    badges: ['ISO Certified', 'B2B Verified'],
    priceRange: 'Custom B2B Quotations',
    services: ['CNC Milling', 'VMC Precision Parts', 'Batch Component Production'],
  },
  {
    id: 'biz-06',
    name: 'Adyar Organic Organics & Coldpress',
    slug: 'adyar-organic-organics-coldpress',
    tagline: 'Certified Organic Country Grains, Pure Ghee & Marachekku Oils',
    category: 'Organic Grocery Stores',
    locality: 'Adyar',
    city: 'Chennai',
    rating: 4.8,
    reviews: 130,
    phone: '+91 97910 88776',
    whatsapp: '919791088776',
    timing: 'Open Now (7:00 AM - 9:30 PM)',
    verified: true,
    featured: false,
    badges: ['FSSAI Certified', 'Farm Direct'],
    priceRange: '₹120 - ₹850',
    services: ['Cold-Pressed Sesame/Groundnut Oil', 'Traditional Rice Varieties', 'Organic Honey'],
  }
];

const POPULAR_CATEGORIES = [
  { name: 'AC Repair & Service', tamil: 'ஏசி பழுதுபார்த்தல்', slug: 'ac-repair-service', icon: Wind, count: '148 providers' },
  { name: 'Electricians', tamil: 'மின்சார பணியாளர்கள்', slug: 'electricians', icon: Zap, count: '230 providers' },
  { name: 'Plumbers', tamil: 'குழாய் பழுதுபார்ப்பவர்கள்', slug: 'plumbers', icon: Wrench, count: '195 providers' },
  { name: 'Dental Clinics', tamil: 'பல் மருத்துவமனைகள்', slug: 'dental-clinics', icon: Smile, count: '112 clinics' },
  { name: 'Packers & Movers', tamil: 'பேக்கர்ஸ் மற்றும் மூவர்ஸ்', slug: 'packers-movers', icon: Truck, count: '84 companies' },
  { name: 'Car Mechanics', tamil: 'கார் பழுதுபார்ப்பு', slug: 'car-repair-service', icon: CarFront, count: '160 garages' },
  { name: 'House Painters', tamil: 'வண்ணப்பூசுபவர்கள்', slug: 'painters', icon: Paintbrush, count: '90 contractors' },
  { name: 'B2B Manufacturers', tamil: 'தொழில்துறை தயாரிப்பு', slug: 'cnc-machining-fabricators', icon: Briefcase, count: '75 suppliers' },
];

const CHENNAI_LOCALITIES = [
  'T. Nagar (600017)',
  'Adyar (600020)',
  'Velachery (600042)',
  'Anna Nagar (600040)',
  'Mylapore (600004)',
  'Guindy (600032)',
  'Nungambakkam (600034)',
  'Tambaram (600045)',
  'Porur (600116)',
  'OMR - Sholinganallur (600119)',
  'Chromepet (600044)',
  'Vadapalani (600026)'
];

export default function LocalBizHomePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedLocality, setSelectedLocality] = React.useState('All Chennai');
  const [enquiryModalBiz, setEnquiryModalBiz] = React.useState<any | null>(null);
  const [enquirySuccess, setEnquirySuccess] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    phone: '',
    message: '',
    service: '',
  });

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setEnquirySuccess(true);
    setTimeout(() => {
      setEnquirySuccess(false);
      setEnquiryModalBiz(null);
      setFormData({ name: '', phone: '', message: '', service: '' });
    }, 2200);
  };

  const filteredBusinesses = FEATURED_BUSINESSES.filter(biz => {
    const matchesLocality = selectedLocality === 'All Chennai' || biz.locality.toLowerCase().includes(selectedLocality.toLowerCase().split(' ')[0]);
    const matchesQuery = !searchQuery || 
      biz.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      biz.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      biz.services.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLocality && matchesQuery;
  });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors">
      <LocalBizHeader />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-950 to-zinc-950 text-white pt-14 pb-20 px-4 sm:px-6">
          {/* Subtle geometric grid background */}
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem]" />
          
          <div className="relative max-w-5xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Chennai&apos;s Trusted Local Business & Service Directory</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
              Find Local Businesses. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">
                Connect Better.
              </span>
            </h1>

            <p className="max-w-2xl mx-auto text-sm sm:text-base text-zinc-300 leading-relaxed">
              Discover verified electricians, AC mechanics, plumbers, healthcare clinics, retail shops, and industrial B2B manufacturers across Chennai with zero middleman commission.
            </p>

            {/* SEARCH BOX */}
            <div className="max-w-3xl mx-auto pt-4">
              <div className="bg-white dark:bg-zinc-900 p-2 sm:p-2.5 rounded-2xl sm:rounded-full shadow-2xl shadow-blue-950/50 border border-zinc-200/80 dark:border-zinc-800 flex flex-col sm:flex-row items-center gap-2 text-zinc-900 dark:text-zinc-100">
                {/* Locality Selector */}
                <div className="flex items-center gap-2 px-3 py-2 w-full sm:w-auto border-b sm:border-b-0 sm:border-r border-zinc-200 dark:border-zinc-800 text-sm">
                  <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <select
                    value={selectedLocality}
                    onChange={(e) => setSelectedLocality(e.target.value)}
                    className="bg-transparent text-xs sm:text-sm font-medium focus:outline-none cursor-pointer w-full text-zinc-800 dark:text-zinc-200"
                  >
                    <option value="All Chennai">All Chennai, TN</option>
                    {CHENNAI_LOCALITIES.map(loc => (
                      <option key={loc} value={loc} className="bg-white dark:bg-zinc-900">{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Keyword Search */}
                <div className="flex items-center gap-2.5 px-3 py-1 flex-1 w-full">
                  <Search className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search by business, service or product (e.g. AC Repair, Mylapore Electrician)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm placeholder:text-zinc-400 focus:outline-none"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Search Button */}
                <Button 
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl sm:rounded-full shadow-md shadow-blue-600/30"
                  onClick={() => {}}
                >
                  Explore
                </Button>
              </div>

              {/* Popular quick tags */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-zinc-400">
                <span className="font-medium text-zinc-300">Quick Searches:</span>
                {['AC Repair', 'Electrician', 'Plumber', 'Dental Clinic', 'Car Mechanic', 'CNC Fabricator'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 border border-white/10 transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* POPULAR CATEGORIES GRID */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Browse By Industry
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                Popular Business Categories
              </h2>
            </div>
            <Link
              href="/categories"
              className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>View All 60+ Categories</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {POPULAR_CATEGORIES.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <div
                  key={cat.slug}
                  onClick={() => setSearchQuery(cat.name)}
                  className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-sm text-zinc-900 dark:text-white mt-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-zinc-500 font-medium">
                    {cat.tamil}
                  </p>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px] text-zinc-500">
                    <span>{cat.count}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* VERIFIED CHENNAI BUSINESSES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-xs">
                  <ShieldCheck className="w-3 h-3" />
                  Verified & Reviewed
                </Badge>
                <span className="text-xs text-zinc-500">
                  Showing {filteredBusinesses.length} verified businesses
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                Top Rated Businesses in Chennai
              </h2>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-zinc-500 flex items-center gap-1 font-medium">
                <Filter className="w-3 h-3" /> Filter:
              </span>
              {['All Chennai', 'T. Nagar', 'Mylapore', 'Velachery', 'Anna Nagar'].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocality(loc)}
                  className={`px-3 py-1.5 rounded-full font-medium transition-all ${
                    selectedLocality === loc
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 space-y-3">
              <HelpCircle className="w-12 h-12 text-zinc-400 mx-auto" />
              <h3 className="font-bold text-base text-zinc-800 dark:text-zinc-200">No businesses match your criteria</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Try selecting a different Chennai locality or clearing your search term to view all verified listings.
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setSearchQuery(''); setSelectedLocality('All Chennai'); }}
                className="rounded-xl"
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map((biz) => (
                <div
                  key={biz.id}
                  className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header: Category & Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {biz.category}
                      </span>
                      {biz.featured && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Sponsored
                        </span>
                      )}
                    </div>

                    {/* Business Name */}
                    <div>
                      <h3 className="font-bold text-base text-zinc-900 dark:text-white leading-snug">
                        {biz.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1">
                        {biz.tagline}
                      </p>
                    </div>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md">
                        <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                        <span>{biz.rating}</span>
                      </div>
                      <span className="text-zinc-500">
                        ({biz.reviews} reviews)
                      </span>
                      <span className="text-zinc-300 dark:text-zinc-700">•</span>
                      <span className="text-zinc-500 font-medium">{biz.priceRange}</span>
                    </div>

                    {/* Location & Timings */}
                    <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span>{biz.locality}, {biz.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">{biz.timing}</span>
                      </div>
                    </div>

                    {/* Services Chips */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {biz.services.slice(0, 3).map(service => (
                        <span key={service} className="text-[11px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    {/* Call Direct */}
                    <a
                      href={`tel:${biz.phone}`}
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>Call</span>
                    </a>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${biz.whatsapp}?text=Hi%20${encodeURIComponent(biz.name)},%20I%20found%20your%20listing%20on%20Local%20Biz.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>

                    {/* Send Enquiry */}
                    <button
                      onClick={() => setEnquiryModalBiz(biz)}
                      className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
                    >
                      <span>Enquire</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CHENNAI LOCALITY EXPLORER */}
        <section className="bg-white dark:bg-zinc-900/60 border-y border-zinc-200 dark:border-zinc-800 py-12 px-4 sm:px-6 my-10">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Explore Chennai By Locality
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
                Hyperlocal Business Hubs
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Connect with neighborhood shops and technicians near your doorstep.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
              {CHENNAI_LOCALITIES.map((loc) => {
                const localityName = loc.split(' ')[0];
                return (
                  <button
                    key={loc}
                    onClick={() => { setSelectedLocality(loc); }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200 dark:border-zinc-700/80 transition-all"
                  >
                    <MapPin className="w-3 h-3 text-blue-600" />
                    <span>{loc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* BUSINESS OWNER CALL TO ACTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-950 to-zinc-950 text-white p-8 sm:p-12 relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <Badge variant="warning" className="text-xs">
                Free Registration For Business Owners
              </Badge>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Grow Your Business in Chennai. Get Direct Customer Calls & Leads.
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Join over 2,000+ local Chennai businesses on Local Biz. Create your free business profile, display your catalogue, and start receiving verified customer calls today.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/list-your-business">
                  <Button className="bg-white text-zinc-950 hover:bg-zinc-100 font-bold px-6 py-3 rounded-xl shadow-lg">
                    <PlusCircle className="w-4 h-4 mr-2 text-blue-600" />
                    List Your Business (Free)
                  </Button>
                </Link>
                <Link href="/pricing">
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 rounded-xl">
                    View Paid Growth Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ENQUIRY MODAL */}
      {enquiryModalBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Direct Enquiry
                </span>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                  {enquiryModalBiz.name}
                </h3>
                <p className="text-xs text-zinc-500">{enquiryModalBiz.locality}, Chennai</p>
              </div>
              <button 
                onClick={() => setEnquiryModalBiz(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg p-1"
              >
                ✕
              </button>
            </div>

            {enquirySuccess ? (
              <div className="text-center py-8 space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-base text-zinc-900 dark:text-white">Enquiry Delivered!</h4>
                <p className="text-xs text-zinc-500">
                  {enquiryModalBiz.name} has been notified and will contact you shortly via phone/WhatsApp.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Mobile Number (Required)</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9840012345"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Service / Requirement</label>
                  <input
                    type="text"
                    placeholder="e.g. Split AC servicing or quote"
                    value={formData.service}
                    onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Message (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you need..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div className="flex items-start gap-2 pt-1 text-[11px] text-zinc-500">
                  <input type="checkbox" defaultChecked required className="mt-0.5 rounded text-blue-600" />
                  <span>I authorize Local Biz to share my contact with {enquiryModalBiz.name} for quotation purposes.</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEnquiryModalBiz(null)}
                    className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    size="sm" 
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
                  >
                    Send Quotation Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <LocalBizFooter />
    </div>
  );
}
