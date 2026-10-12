'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Building2, 
  Search, 
  MapPin, 
  PlusCircle, 
  Layers, 
  Menu, 
  X, 
  ShieldCheck, 
  Sparkles,
  User,
  Share2
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/Button';

export function LocalBizHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCity, setSelectedCity] = React.useState('Chennai');

  const isGroupLinks = pathname?.startsWith('/groups');
  const isLocalBiz = !isGroupLinks;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}&city=${encodeURIComponent(selectedCity.toLowerCase())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md transition-colors">
      {/* Top Banner & Multi-Platform Switcher Bar */}
      <div className="bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200/60 dark:border-zinc-800/60 text-xs px-4 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Segmented Switcher */}
          <div className="flex items-center gap-1.5 font-medium">
            <span className="text-zinc-700 dark:text-zinc-300 mr-1 hidden sm:inline">Platform:</span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-800">
              <Link
                href="/groups"
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isGroupLinks
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Share2 className="w-3 h-3" />
                GROUP LINKS
              </Link>
              <Link
                href="/local-biz"
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isLocalBiz
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3 h-3" />
                LOCAL BIZ
              </Link>
            </div>
          </div>

          {/* Quick city selector & trust pill */}
          <div className="flex items-center gap-4 text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="Chennai" className="bg-white dark:bg-zinc-900">Chennai, TN</option>
                <option value="Coimbatore" className="bg-white dark:bg-zinc-900">Coimbatore, TN</option>
                <option value="Madurai" className="bg-white dark:bg-zinc-900">Madurai, TN</option>
                <option value="Trichy" className="bg-white dark:bg-zinc-900">Trichy, TN</option>
              </select>
            </div>
            <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-500">
              <ShieldCheck className="w-3 h-3 text-emerald-500" /> Verified Indian Directory
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/local-biz" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
            LB
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-zinc-900 dark:text-white">
                Local Biz
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                India
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              Find Local. Connect Better.
            </p>
          </div>
        </Link>

        {/* Global Search Bar (Desktop) */}
        <form 
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-lg items-center relative"
        >
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search AC repair, electricians, clinics in Chennai..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-24 rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-zinc-950 transition-all"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Nav Links & Controls */}
        <div className="hidden lg:flex items-center gap-5 text-sm font-medium">
          <Link 
            href="/categories" 
            className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <Layers className="w-4 h-4" />
            Categories
          </Link>
          <Link 
            href="/locations" 
            className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <MapPin className="w-4 h-4" />
            Locations
          </Link>
          <Link 
            href="/pricing" 
            className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Plans
          </Link>
          <Link 
            href="/local-biz/admin" 
            className="text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            Admin
          </Link>
        </div>

        {/* Action Buttons & Theme Switcher */}
        <div className="flex items-center gap-2.5">
          {/* Light / Dark Mode Switcher */}
          <ThemeToggle />

          {/* List Your Business Button */}
          <Link href="/list-your-business" className="hidden sm:inline-flex">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl gap-1.5 shadow-sm shadow-blue-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>List Business</span>
            </Button>
          </Link>

          {/* User Sign In / Account Button */}
          <Link href="/login">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl border-zinc-200 dark:border-zinc-800 gap-1.5 font-medium"
            >
              <User className="w-4 h-4 text-zinc-500" />
              <span>Sign In</span>
            </Button>
          </Link>

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 pt-3 pb-6 space-y-3">
          {/* Mobile Search */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search local businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-sm"
            />
            <button
              type="submit"
              className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-blue-600 text-white text-xs font-semibold"
            >
              Search
            </button>
          </form>

          {/* Links */}
          <div className="flex flex-col space-y-2 text-sm font-medium pt-2">
            <Link 
              href="/categories" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <Layers className="w-4 h-4 text-zinc-500" />
              Categories
            </Link>
            <Link 
              href="/locations" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <MapPin className="w-4 h-4 text-zinc-500" />
              Locations & Chennai Areas
            </Link>
            <Link 
              href="/pricing" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              Plans & Pricing
            </Link>
            <Link 
              href="/list-your-business" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/50"
            >
              <PlusCircle className="w-4 h-4" />
              List Your Business (Free)
            </Link>
            <Link 
              href="/local-biz/admin" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <ShieldCheck className="w-4 h-4 text-blue-500" />
              Admin Portal
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
