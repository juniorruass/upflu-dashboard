// ─── Clients ────────────────────────────────────────────────────────────────

export type ClientStatus = "active" | "onboarding" | "paused" | "ended" | "apresentacao" | "captado";

export type ServiceType =
  | "ai" | "automation" | "traffic" | "chatbot" | "crm" | "funnel" | "whatsapp" | "seo";

export interface Client {
  id: string;
  name: string;
  segment: string;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  status: ClientStatus;
  monthly_value: number;
  start_date: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  captado_via: string | null;
  created_at: string;
  updated_at: string;
  services?: ClientService[];
  metrics?: ClientMetric[];
  notes?: ClientNote[];
}

export interface ClientService {
  id: string;
  client_id: string;
  service: ServiceType;
  created_at: string;
}

export interface ClientMetric {
  id: string;
  client_id: string;
  month: string;
  leads: number | null;
  conversions: number | null;
  revenue: number | null;
  ad_spend: number | null;
  created_at: string;
}

export interface ClientNote {
  id: string;
  client_id: string;
  content: string;
  author: string;
  created_at: string;
}

// ─── Carousels ───────────────────────────────────────────────────────────────

export type CarouselStatus = "pending" | "approved" | "declined";

export interface Carousel {
  id: string;
  status: CarouselStatus;
  post_number: number | null;
  topic: string;
  caption: string | null;
  created_at: string;
  approved_at: string | null;
  declined_at: string | null;
  slides?: Slide[];
}

export interface Slide {
  id: string;
  carousel_id: string;
  slide_number: number;
  html_content: string;   // DB column name — never changes
  image_url: string | null;
  created_at: string;
}

export interface GeneratedCarousel {
  topic: string;
  caption: string;
  slides: GeneratedSlide[];
}

// Claude returns "html" (not "html_content") — mapped on save
export interface GeneratedSlide {
  slide_number: number;
  html: string;
}
