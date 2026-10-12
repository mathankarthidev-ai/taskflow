export type AppRole = 
  | 'guest'
  | 'customer'
  | 'business_owner'
  | 'sales_agent'
  | 'sales_manager'
  | 'moderator'
  | 'admin'
  | 'superadmin';

export type BusinessVerificationStatus = 
  | 'unclaimed'
  | 'claimed'
  | 'phone_verified'
  | 'document_verified'
  | 'verified'
  | 'rejected';

export type BusinessPublicationStatus = 
  | 'draft'
  | 'pending_approval'
  | 'published'
  | 'suspended'
  | 'archived';

export type EnquiryStatus = 
  | 'submitted'
  | 'delivered'
  | 'viewed'
  | 'contacted'
  | 'qualified'
  | 'converted'
  | 'closed'
  | 'rejected'
  | 'disputed';

export type ReviewStatus = 
  | 'pending'
  | 'published'
  | 'flagged'
  | 'rejected';

export type ClaimStatus = 
  | 'pending'
  | 'under_review'
  | 'approved'
  | 'rejected';

export type SubscriptionStatus = 
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type PaymentStatus = 
  | 'created'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded';

export type SalesProspectStage = 
  | 'new'
  | 'contacted'
  | 'demo'
  | 'trial'
  | 'paid'
  | 'lost';

// 1. Identity & Profiles
export interface Profile {
  id: string; // references auth.users
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  preferred_language: 'en' | 'ta';
  city?: string;
  state?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user_id: string;
  role: 'owner' | 'manager' | 'staff';
  status: 'active' | 'invited' | 'removed';
  created_at: string;
}

export interface NotificationRecord {
  id: string;
  user_id: string;
  type: 'enquiry' | 'review' | 'claim' | 'subscription' | 'system';
  title: string;
  message: string;
  link?: string;
  read_at?: string;
  created_at: string;
}

// 2. Taxonomy & Locations
export interface Category {
  id: string;
  name: string;
  name_en: string;
  name_ta?: string;
  slug: string;
  description?: string;
  icon?: string;
  parent_id?: string;
  is_active: boolean;
  sort_order: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
}

export interface LocationRecord {
  id: string;
  name: string;
  name_ta?: string;
  slug: string;
  type: 'country' | 'state' | 'city' | 'locality';
  parent_id?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
}

// 3. Businesses
export interface Business {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  description_ta?: string;
  primary_category_id: string;
  logo_url?: string;
  cover_url?: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  address_line1: string;
  address_line2?: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  year_established?: number;
  business_type?: 'retail' | 'service' | 'manufacturer' | 'wholesale' | 'professional';
  verification_status: BusinessVerificationStatus;
  publication_status: BusinessPublicationStatus;
  completeness_score: number;
  plan_tier: 'free' | 'basic' | 'growth' | 'professional';
  rating: number;
  review_count: number;
  is_featured: boolean;
  owner_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface BusinessHours {
  id: string;
  business_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  open_time: string; // '09:00'
  close_time: string; // '20:00'
  is_closed: boolean;
}

export interface BusinessImage {
  id: string;
  business_id: string;
  image_url: string;
  caption?: string;
  sort_order: number;
  is_cover: boolean;
  created_at: string;
}

export interface BusinessClaim {
  id: string;
  business_id: string;
  user_id: string;
  verification_method: 'phone_otp' | 'document' | 'manual_review';
  document_url?: string;
  status: ClaimStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  business_id: string;
  name: string;
  name_ta?: string;
  description?: string;
  price_min?: number; // in paise
  price_max?: number; // in paise
  is_active: boolean;
  created_at: string;
}

export interface ProductItem {
  id: string;
  business_id: string;
  name: string;
  name_ta?: string;
  description?: string;
  price: number; // in paise
  currency: string;
  image_url?: string;
  is_available: boolean;
  created_at: string;
}

// 4. Engagement & Enquiries
export interface Enquiry {
  id: string;
  business_id: string;
  customer_id?: string;
  service_id?: string;
  product_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  message: string;
  preferred_contact: 'phone' | 'whatsapp' | 'email';
  consent_given: boolean;
  status: EnquiryStatus;
  status_updated_at?: string;
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  author_id: string;
  rating: number; // 1 to 5
  review_title?: string;
  review_text: string;
  status: ReviewStatus;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewResponse {
  id: string;
  review_id: string;
  business_id: string;
  responder_id: string;
  response_text: string;
  created_at: string;
}

export interface SavedBusiness {
  id: string;
  user_id: string;
  business_id: string;
  created_at: string;
}

// 5. Monetization & Subscriptions
export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: 'free' | 'basic' | 'growth' | 'professional';
  price_paise: number;
  billing_interval: 'month' | 'year';
  features: string[];
  limits: {
    photos: number;
    categories: number;
    products: number;
    services: number;
    featured_placement: boolean;
    analytics_level: 'basic' | 'advanced' | 'enterprise';
  };
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  business_id: string;
  plan_id: string;
  provider_subscription_id?: string;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentRecord {
  id: string;
  business_id: string;
  subscription_id?: string;
  provider: 'razorpay' | 'manual';
  provider_payment_id: string;
  provider_order_id?: string;
  amount_paise: number;
  currency: string;
  status: PaymentStatus;
  receipt_number?: string;
  created_at: string;
}

// 6. Sales CRM
export interface SalesProspect {
  id: string;
  business_name: string;
  contact_person: string;
  phone: string;
  email?: string;
  locality: string;
  city: string;
  category_id?: string;
  assigned_agent_id?: string;
  stage: SalesProspectStage;
  next_follow_up?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SalesActivity {
  id: string;
  prospect_id: string;
  agent_id: string;
  activity_type: 'call' | 'visit' | 'demo' | 'note';
  summary: string;
  outcome?: string;
  created_at: string;
}

export interface CommissionRecord {
  id: string;
  agent_id: string;
  payment_id: string;
  amount_paise: number;
  rate_percentage: number;
  payout_status: 'pending' | 'approved' | 'paid';
  paid_at?: string;
  created_at: string;
}
