export type ServiceItem = {
  id?: string;
  title: string;
  text: string;
  /** Optional icon image URL (shown instead of the default sparkles icon) */
  image_url?: string;
  active?: boolean;
};

export interface Widget {
  id: string;
  title: string;
  type: 'hero' | 'services' | 'portfolio' | 'about' | 'testimonials' | 'contact' | 'custom';
  content: Record<string, any>;
  visible: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

export type FooterNavLink = { href: string; label: string };

export type SiteFooterSettings = {
  brand_title?: string;
  tagline?: string;
  copyright?: string;
  nav_heading?: string;
  connect_heading?: string;
  /** Override default nav links; omit or empty to use site defaults */
  nav_links?: FooterNavLink[];
};

/** Browser title, meta description, Open Graph, favicon (stored in site_settings.contact_info JSON). */
export type SiteSeoSettings = {
  site_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  /** Public URL to .ico, .png, or .svg (e.g. Supabase Storage or /favicon.ico). */
  favicon_url?: string;
};

/** Resolved SEO for the public site (same keys as persisted, all strings). */
export type PublicSiteSeo = {
  site_title: string;
  meta_description: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  favicon_url: string;
};

export const SITE_SEO_DEFAULTS: PublicSiteSeo = {
  site_title: 'Visily Studio | Premium Digital Experiences',
  meta_description:
    'Crafting exceptional digital products and experiences. Explore our work, services, and connect with us.',
  og_title: 'Visily Studio | Premium Digital Experiences',
  og_description: 'We design and build beautiful, high-performance digital products.',
  og_image_url: '/og-image.jpg',
  favicon_url: '/favicon.jpg',
};

export type SiteControls = {
  maintenance_mode?: boolean;
  pages?: {
    home?: boolean;
    about?: boolean;
    services?: boolean;
    projects?: boolean;
    reviews?: boolean;
    contact?: boolean;
  };
  sections?: {
    hero?: boolean;
    about?: boolean;
    services?: boolean;
    projects?: boolean;
    reviews?: boolean;
    contact?: boolean;
  };
};

export interface SiteSettings {
  id: number;
  social_links: Array<{ platform: string; url: string; icon?: string }>;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
    hours?: string;
    map_embed_url?: string;
    /** Elfsight widget app UUID only (e.g. f45ce138-bd56-4e17-a6ef-f0bc1d2901c8). Omit to disable embed. */
    elfsight_google_reviews_app_id?: string;
    footer?: SiteFooterSettings;
    controls?: SiteControls;
    seo?: SiteSeoSettings;
  };
  whatsapp_number: string;
  updated_at: string;
}

export interface AnalyticsEntry {
  id: string;
  ip_address: string | null;
  user_agent: string | null;
  device_model: string | null;
  os: string | null;
  browser: string | null;
  country: string | null;
  page_path: string | null;
  referrer: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  /** Customer's WhatsApp number, if provided. */
  whatsapp: string | null;
  subject: string | null;
  message: string;
  read: boolean;
  /** Admin reply text, stored after the admin sends a reply. */
  admin_reply: string | null;
  /** Timestamp when the admin sent the reply. */
  replied_at: string | null;
  created_at: string;
}
