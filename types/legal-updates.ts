export type LegalUpdateContentType = 'alert' | 'analysis' | 'guide' | 'update';

export interface LegalUpdateCategory {
  id: number;
  name: string;
  description?: string | null;
}

export interface LegalUpdate {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  content_type: LegalUpdateContentType;
  category_id?: number | null;
  category?: LegalUpdateCategory | null;
  author?: string | null;
  seo_keywords?: string | null;
  meta_description?: string | null;
  featured: boolean;
  published: boolean;
  published_date?: string | null;
  view_count: number;
  notify_subscribers: boolean;
  created_by?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LegalUpdateSubscriber {
  id: number;
  email: string;
  name?: string | null;
  is_confirmed: boolean;
  is_active: boolean;
  createdAt: string;
  confirmedAt?: string | null;
}
