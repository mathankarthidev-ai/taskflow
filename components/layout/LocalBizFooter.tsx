import Link from 'next/link';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Heart,
  CheckCircle2
} from 'lucide-react';

export function LocalBizFooter() {
  return (
    <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 transition-colors">
      {/* Upper Footer: Value Props */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/80 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-white">Authentic Indian Directory</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Every business listing is reviewed with valid phone and location checks in Chennai & Tamil Nadu.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex-shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-white">Zero Brokerage & Direct Contact</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Connect directly with service providers via phone call or WhatsApp with transparent pricing.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-white">Empowering Local MSMEs</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Free standard listings for shop owners, technicians, and local B2B manufacturers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Directory Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 text-xs">
        {/* Brand & Contact */}
        <div className="col-span-2 lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              LB
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-white">
                Local Biz
              </span>
              <p className="text-[11px] text-zinc-500">Find Local. Connect Better.</p>
            </div>
          </div>
          <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400 pr-6">
            Local Biz is India&apos;s reliable local search directory and marketplace platform connecting customers with trusted service providers, retailers, professionals, and manufacturers across Chennai and Tamil Nadu.
          </p>
          <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Anna Salai, T. Nagar, Chennai, Tamil Nadu 600017</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>+91 44 2828 0000 (Mon - Sat, 9:00 AM - 7:00 PM IST)</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              <span>support@localbiz.in</span>
            </div>
          </div>
        </div>

        {/* Popular Categories */}
        <div className="space-y-3">
          <h5 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
            Popular Services
          </h5>
          <ul className="space-y-2">
            <li><Link href="/categories/ac-repair-service" className="hover:text-blue-600 transition-colors">AC Repair & Service</Link></li>
            <li><Link href="/categories/electricians" className="hover:text-blue-600 transition-colors">Electricians</Link></li>
            <li><Link href="/categories/plumbers" className="hover:text-blue-600 transition-colors">Plumbers</Link></li>
            <li><Link href="/categories/home-cleaning" className="hover:text-blue-600 transition-colors">Home Cleaning</Link></li>
            <li><Link href="/categories/pest-control" className="hover:text-blue-600 transition-colors">Pest Control</Link></li>
            <li><Link href="/categories/car-repair-service" className="hover:text-blue-600 transition-colors">Car Mechanics</Link></li>
            <li><Link href="/categories" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">View All 60+ Categories →</Link></li>
          </ul>
        </div>

        {/* Chennai Localities */}
        <div className="space-y-3">
          <h5 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
            Chennai Areas
          </h5>
          <ul className="space-y-2">
            <li><Link href="/locations/chennai/t-nagar" className="hover:text-blue-600 transition-colors">T. Nagar (600017)</Link></li>
            <li><Link href="/locations/chennai/adyar" className="hover:text-blue-600 transition-colors">Adyar (600020)</Link></li>
            <li><Link href="/locations/chennai/velachery" className="hover:text-blue-600 transition-colors">Velachery (600042)</Link></li>
            <li><Link href="/locations/chennai/anna-nagar" className="hover:text-blue-600 transition-colors">Anna Nagar (600040)</Link></li>
            <li><Link href="/locations/chennai/tambaram" className="hover:text-blue-600 transition-colors">Tambaram (600045)</Link></li>
            <li><Link href="/locations/chennai/omr" className="hover:text-blue-600 transition-colors">OMR Corridor (600096)</Link></li>
            <li><Link href="/locations" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">All Chennai Locations →</Link></li>
          </ul>
        </div>

        {/* Business & Legal */}
        <div className="space-y-3">
          <h5 className="font-semibold text-zinc-900 dark:text-white uppercase tracking-wider text-[11px]">
            For Business & Legal
          </h5>
          <ul className="space-y-2">
            <li><Link href="/list-your-business" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">List Your Business</Link></li>
            <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">Subscription Plans</Link></li>
            <li><Link href="/business/dashboard" className="hover:text-blue-600 transition-colors">Business Dashboard</Link></li>
            <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
            <li><Link href="/listing-policy" className="hover:text-blue-600 transition-colors">Listing Guidelines</Link></li>
            <li><Link href="/refund-policy" className="hover:text-blue-600 transition-colors">Refund Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="border-t border-zinc-200/80 dark:border-zinc-800/80 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} Local Biz India. All rights reserved. Built with pride in Tamil Nadu.</p>
          <p className="flex items-center gap-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
            <span>for Indian Local Commerce</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
