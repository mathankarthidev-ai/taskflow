# LOCAL BIZ — Architectural Decisions & Specifications (docs/DECISIONS.md)

**Project Name:** Local Biz  
**Tagline:** Find Local. Connect Better.  
**Initial Launch Market:** Chennai, Tamil Nadu, India (expanding across Tamil Nadu, then nationwide)  
**Primary Currency:** Indian Rupee (INR - ₹), stored in database as integer paise (e.g., ₹999 = 99900 paise)  
**Timezone:** Asia/Kolkata (IST, UTC+05:30)  
**Language Support:** Bilingual foundational architecture (English & Tamil: `name_en`, `name_ta`, `description_en`, `description_ta`)

---

## 1. Core Architecture & Tech Stack

- **Framework:** Next.js 15+ (App Router) with React 19 and TypeScript strict mode.
- **Server vs. Client Boundary:** React Server Components (RSC) by default for SEO, high-performance static/dynamic rendering, and secure data access; Client Components (`'use client'`) strictly reserved for interactive controls (search autocomplete, modals, forms, theme toggling, interactive maps).
- **Styling & Tokens:** Tailwind CSS with shadcn/ui architectural patterns.
  - Primary Brand Color: Deep Blue (`#0B2545` / `#134074` / `#1D4ED8`).
  - Neutral / Surfaces: Light neutral slate/zinc (`#F8FAFC`, `#FFFFFF`), accessible dark mode support (`#0F172A`, `#1E293B`).
  - Typography: Inter / Plus Jakarta Sans font stack with clear contrast hierarchies.
- **Database Engine:** Supabase PostgreSQL with Row Level Security (RLS) enabled on all public schema tables.
- **Authentication:** Supabase Auth (Email + Password, Google OAuth ready, optional SMS/OTP verification behind provider interface).
- **State Management:** URL-first state for search, filters, pagination, and tabs; minimal Zustand strictly for client-side transient UI states if needed; TanStack Query for dynamic client-side cache where applicable.
- **Form Handling & Validation:** React Hook Form with Zod schemas matching database constraints.

---

## 2. Role-Based Access Control (RBAC) Model

We implement seven distinct, securely verifiable product roles:
1. **Guest:** Unauthenticated visitors. Allowed to browse approved public businesses, categories, locations, reviews, blogs, and public pricing. Cannot view private business leads or submit reviews without authentication.
2. **Customer:** Authenticated user with role `customer`. Can manage profile, save favourite businesses, submit enquiries to businesses, write/edit own reviews, receive notification alerts, and track lead inquiry statuses.
3. **Business Owner:** User authorized as owner or manager via `business_members` join table. Can claim/create listings, edit business profile, manage photo gallery, operating hours, products/services catalogue, view incoming enquiries/leads, reply to reviews, and manage subscriptions.
4. **Sales Agent / Sales Manager:** Assigned internal user role for local business onboarding. Can view and update assigned business prospects (`sales_prospects`), log calls/visits/demos (`sales_activities`), track onboarding pipeline, and view transparent commission statements. Cannot access unrelated customer personal data or system settings.
5. **Moderator:** Staff role with permissions to review pending business listings, approve/reject listing claims (`business_claims`), review reported content, and moderate customer reviews according to content policy.
6. **Admin:** Full day-to-day platform operator. Controls categories, locations, subscriptions, plans, featured banners, leads, user accounts, and platform analytics.
7. **Superadmin:** Privileged role reserved for core maintainers. Capable of managing admin roles, executing audit log reviews, and modifying high-risk platform configuration keys.

**Security Rule:** Users can never self-assign privileged roles (`sales_agent`, `moderator`, `admin`, `superadmin`). Roles are verified server-side via `user_roles` table with service-role security and RLS policies.

---

## 3. Database Schema & Migration Strategy

- Migrations are version-controlled in `supabase/migrations/` as raw idempotent SQL files.
- All primary keys use `UUID` defaults (`gen_random_uuid()`).
- High-traffic lookup columns (slugs, category IDs, location IDs, status columns, created_at) are indexed.
- Full-text search leverages PostgreSQL native `tsvector` with GIN indexing, supporting trigram fuzzy matching (`pg_trgm`) where available.
- Monetization values use integer paise to eliminate floating-point arithmetic errors.
- Soft-deletion support via `deleted_at TIMESTAMPTZ` on core tables (`businesses`, `reviews`).

---

## 4. Business Claim & Verification Lifecycle

Listings progress through distinct, audited verification states:
- `unclaimed`: Created via public directory ingestion or directory discovery. Publicly claimable.
- `claimed`: Claim requested by a registered user; pending OTP verification or document review.
- `phone_verified`: Automated or agent-verified contact confirmation.
- `document_verified`: Official business registration / GST / trade license verified by moderation team.
- `published`: Visible to the public directory and search engines.
- `suspended`: Temporarily or permanently removed due to policy infringement, user reports, or non-payment.

---

## 5. Monetization & Pricing Tier Defaults

Configurable in database (`subscription_plans`), with the following initial INR defaults:
1. **Free (₹0/mo):** Basic profile, up to 3 photos, 1 primary category, standard organic visibility, direct contact links.
2. **Basic (₹999/mo / ₹9,990/yr):** Verified badge, up to 10 photos, 5 categories, enquiry lead dashboard, basic views analytics.
3. **Growth (₹1,999/mo / ₹19,990/yr):** Everything in Basic + priority search placement, catalogue showcase (up to 25 products/services), WhatsApp lead notifications, eligible featured carousel placement.
4. **Professional (₹2,999/mo / ₹29,990/yr):** Everything in Growth + verified top-tier placement, unlimited products/services, dedicated sales manager support, advanced competitor & keyword analytics, zero enquiry lead caps.

---

## 6. Directory Taxonomy & Geographic Scope

- **Initial Hub:** Chennai, Tamil Nadu.
- **Chennai Key Localities:** T. Nagar, Adyar, Velachery, Anna Nagar, Mylapore, Alwarpet, Nungambakkam, Guindy, Porur, Tambaram, Chromepet, Sholinganallur, OMR, ECR, Vadapalani, Kodambakkam, Perambur, Kilpauk, Egmore, Triplicane, Royapettah, Thiruvanmiyur.
- **Categories:** Over 60 verified categories across 8 primary super-categories (Home & Living, Healthcare & Wellness, Education & Training, Automotive, Food & Dining, Professional & Legal, Retail & Shopping, B2B & Industrial).
