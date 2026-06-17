import Constants from 'expo-constants';
import { supabase } from './supabase';

const BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string) ?? 'https://leadcomarketplace.com';

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers = await authHeaders();
  // Force a network trip on every call — prevents iOS NSURLSession from
  // serving a stale cached response (e.g. old My Leads list right after a purchase).
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...headers,
      ...opts?.headers,
      'Cache-Control': 'no-cache',
      Pragma:          'no-cache',
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`);
  return body as T;
}

// ── Leads ─────────────────────────────────────────────────────────────────
export type Lead = {
  id: string;
  lead_code?: string | null;
  service_category: string;
  job_type: string;
  city: string;
  state: string;
  nationwide: boolean;
  status: string;
  price_cents: number;
  buyer_price_cents?: number;
  public_summary: string | null;
  created_at: string;
  published_at: string | null;
  sold_at: string | null;
  quality_score?: number | null;
  metadata?: Record<string, unknown> | null;
  // Proximity fields — present when buyer location was sent to the API
  distance_miles?: number | null;
  distance_minutes?: number | null;
  // Provider AI score fields
  provider_ai_score?: number | null;
  provider_ai_answer_rate?: number | null;
  provider_ai_calls_analyzed?: number | null;
};

export type PurchasedLead = Lead & {
  purchase_id: string;
  purchased_at: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  private_notes: string | null;
};

export type BuyerLocation = { lat: number; lng: number } | null;

export const leadsApi = {
  getLive: (location?: BuyerLocation) => {
    const params = location
      ? `?buyer_lat=${location.lat}&buyer_lng=${location.lng}`
      : '';
    return request<Lead[]>(`/api/leads${params}`);
  },
  // Append a cache-busting timestamp so iOS NSURLSession never serves a stale
  // cached response for this URL.  Without this, the pre-unlock My Leads list
  // is returned from cache even after a new purchase is created, causing the
  // newly purchased lead to be invisible on the My Leads tab.
  getPurchased: () => request<PurchasedLead[]>(`/api/my-leads?_t=${Date.now()}`),
  /** Fetch the single purchase for a specific lead after unlock (uses purchase_id for direct lookup) */
  getPurchaseByPurchaseId: (purchaseId: string) =>
    request<PurchasedLead[]>(`/api/my-leads?purchase_id=${encodeURIComponent(purchaseId)}`),
  unlock: (id: string)                 => request<{ success: boolean; purchase_id: string }>(`/api/leads/${id}/unlock`, { method: 'POST' }),
};

// ── Lead Rating ───────────────────────────────────────────────────────────────
export type RatingThumb = 'up' | 'down';

export const THUMBS_DOWN_REASONS = [
  { code: 'disconnected',    label: 'Number disconnected or out of service' },
  { code: 'no_answer',       label: "Customer didn't answer after multiple attempts" },
  { code: 'never_requested', label: 'Customer said they never requested a quote' },
  { code: 'already_hired',   label: 'Customer already hired someone else' },
  { code: 'wrong_service',   label: 'Wrong service — lead was mislabeled' },
  { code: 'duplicate',       label: 'Duplicate — I already have this customer' },
  { code: 'wrong_location',  label: 'Address or location was wrong' },
  { code: 'incomplete_info', label: 'Lead info was incomplete or fake-looking' },
] as const;

export const THUMBS_UP_REASONS = [
  { code: 'booked',     label: 'Booked the job' },
  { code: 'interested', label: 'Customer answered and was genuinely interested' },
  { code: 'great_lead', label: 'Great lead — will buy from this provider again' },
] as const;

export const rateApi = {
  submit: (data: { leadId: string; thumb: RatingThumb; reasonCode: string; notes?: string }) =>
    request<{ ok: boolean }>('/api/leads/rate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ── Provider leads ─────────────────────────────────────────────────────────
export type ProviderLead = {
  id: string;
  service_category: string;
  job_type: string;
  city: string;
  state: string;
  nationwide: boolean;
  status: string;
  price_cents: number;
  public_summary: string | null;
  created_at: string;
  published_at: string | null;
};

export const providerApi = {
  getSubmissions: ()                   => request<{ leads: ProviderLead[]; totalEarningsCents: number; soldCount: number; pendingCount: number; liveCount: number }>('/api/provider/leads'),
  updatePrice: (id: string, cents: number) =>
    request<ProviderLead>(`/api/provider/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ price_cents: cents }),
    }),
  deleteLead: (id: string)             => request<{ success: boolean }>(`/api/provider/leads/${id}`, { method: 'DELETE' }),
};

// ── Profile ────────────────────────────────────────────────────────────────
export type Profile = {
  id: string;
  email: string;
  role: 'buyer' | 'provider' | 'admin';
  full_name: string | null;
  phone: string | null;
  onboarding_complete: boolean;
  credits_cents: number;
  notify_email: boolean;
  notify_sms: boolean;
  notify_push: boolean;
};

export const profileApi = {
  get: ()                              => request<Profile>('/api/profile'),
  update: (data: Partial<Profile>)     => request<Profile>('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ── Preferences ────────────────────────────────────────────────────────────
export type Preference = {
  id: string;
  service_category: string;
  area_ids: string[];
  state_codes: string[];       // whole-state selections (e.g. ['FL', 'MA']); no radius applies
  radius_miles: number;        // 1–35 miles radius around each selected city/area center
  max_price_cents: number | null;
  notify_email: boolean;
  notify_push: boolean;
  notify_sms?: boolean;
};

export const preferencesApi = {
  get:    ()                             => request<Preference[]>('/api/preferences'),
  save:   (data: Partial<Preference>)    => request<Preference>('/api/preferences', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Preference>) =>
    request<{ ok: boolean }>(`/api/preferences/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string)                   => request<{ success: boolean }>(`/api/preferences/${id}`, { method: 'DELETE' }),
};

// ── Service Categories ─────────────────────────────────────────────────────
export type ServiceCategory = {
  id: string;
  name: string;
  group_name: string | null;
};

export const categoriesApi = {
  getAll: () => request<ServiceCategory[]>('/api/categories'),
};

// ── Service Areas ──────────────────────────────────────────────────────────
export type ServiceArea = {
  id: string;
  name: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
};

export const areasApi = {
  getAll: () => request<ServiceArea[]>('/api/areas'),
};

// ── Phone verification ─────────────────────────────────────────────────────
export const phoneVerifyApi = {
  sendCode:   (phone: string) =>
    request<{ ok: boolean; phone: string }>('/api/profile/phone/send-code', {
      method: 'POST', body: JSON.stringify({ phone }),
    }),
  verifyCode: (code: string) =>
    request<{ ok: boolean; phone: string }>('/api/profile/phone/verify-code', {
      method: 'POST', body: JSON.stringify({ code }),
    }),
};

// ── Push token registration ────────────────────────────────────────────────
export const pushApi = {
  register: (token: string, platform: string) =>
    request<{ success: boolean }>('/api/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),
};

// ── Credits ────────────────────────────────────────────────────────────────
export const creditsApi = {
  buyCheckout: (amountCents: number) =>
    request<{ checkoutUrl: string; purchaseId: string }>('/api/credits/mobile-checkout', {
      method: 'POST',
      body: JSON.stringify({ amountCents }),
    }),
};

// ── Lead Signals ───────────────────────────────────────────────────────────
// Structured buyer→provider communication. No free text — buttons only.
// Buyer reports a call issue; provider responds with one of four fixed codes.

export interface LeadSignal {
  id:                string;
  purchase_id?:      string;  // present in signal row — used for deep-link navigation
  lead_id?:          string;  // present in signal row — used for deep-link navigation
  signal_type:       "no_answer" | "wrong_number";
  provider_response: "verifying" | "number_correct" | "customer_available" | "info_updated" | null;
  created_at:        string;
  responded_at:      string | null;
  /** Present in provider-side fetch (includes full lead + purchase details) */
  leads?:            {
    id: string;
    lead_code?: string | null;
    service_category: string;
    job_type: string;
    city: string;
    state: string;
    customer_name?: string | null;
    customer_phone?: string | null;
    customer_email?: string | null;
    public_summary?: string | null;
    price_cents?: number;
  };
  purchases?:        { id: string; purchased_at: string; amount_cents?: number };
}

export const signalsApi = {
  /** Buyer creates a signal — "no_answer" or "wrong_number" */
  create: (body: { purchase_id: string; signal_type: "no_answer" | "wrong_number" }) =>
    request<LeadSignal>("/api/lead-signals", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    }),

  /** Buyer checks signal status for a specific purchase */
  getForPurchase: (purchaseId: string) =>
    request<LeadSignal[]>(`/api/lead-signals?purchase_id=${encodeURIComponent(purchaseId)}`),

  /** Provider fetches all signals directed to them (with full lead details) */
  getProviderSignals: () =>
    request<LeadSignal[]>("/api/lead-signals"),

  /** Provider submits a structured response */
  respond: (
    signalId: string,
    response: "verifying" | "number_correct" | "customer_available" | "info_updated"
  ) =>
    request<{ ok: boolean; message: string }>(`/api/lead-signals/${signalId}/respond`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ response }),
    }),
};

// ── Admin ──────────────────────────────────────────────────────────────────
export const adminApi = {
  getOverview: ()                      => request<Record<string, unknown>>('/api/admin/overview'),
  getLeads: (status?: string)          => request<Lead[]>(`/api/admin/leads${status ? `?status=${status}` : ''}`),
  reviewLead: (id: string, action: 'approve' | 'reject', reason?: string) =>
    request<{ success: boolean }>(`/api/admin/review/${id}`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }),
  getUsers: ()                         => request<Profile[]>('/api/admin/users'),
};
