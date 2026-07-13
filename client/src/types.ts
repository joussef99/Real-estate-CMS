import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface Project {
  id: number;
  name: string;
  location: string;
  price_range: string;
  downPayment?: number | string | null;
  type: string;
  status?: string;
  description?: string;
  /** Auto-translated Egyptian colloquial Arabic — null until translation runs successfully. */
  description_ar?: string | null;
  main_image?: string;
  main_image_meta?: MediaAsset | null;
  gallery?: string | string[];
  gallery_meta?: MediaAsset[] | null;
  amenities?: string;
  developer_id: number;
  destination_id: number;
  is_featured?: number;
  beds: string;
  size: string;
  images?: string[];
  developer_name?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  destination_name?: string;
  destination_slug?: string;
}

export interface Developer {
  id: number;
  name: string;
  logo: string;
  logo_meta?: MediaAsset | null;
  description: string;
  description_ar?: string | null;
  slug?: string;
  preview_projects?: Project[];
}

export interface Destination {
  id: number;
  name: string;
  image: string;
  image_meta?: MediaAsset | null;
  description: string;
  description_ar?: string | null;
  slug?: string;
  project_count?: number;
  preview_projects?: Project[];
}

export interface Blog {
  id: number;
  title: string;
  slug?: string;
  content: string;
  /** Auto-translated Egyptian colloquial Arabic — null until translation runs successfully. */
  title_ar?: string | null;
  content_ar?: string | null;
  image: string;
  image_meta?: MediaAsset | null;
  category: string;
  author: string;
  created_at: string;
  meta_title?: string;
  meta_description?: string;
}

export interface MediaAsset {
  url: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export interface Career {
  id: number;
  title: string;
  location: string;
  type: string;
  description: string;
  description_ar?: string | null;
  requirements: string;
  requirements_ar?: string | null;
  apply_link?: string | null;
}

export interface ResaleListing {
  id: number;
  public_id?: string;
  title: string;
  slug?: string;
  location?: string | null;
  price?: string | null;
  paid_amount?: number | null;
  installment_value?: number | null;
  remaining_amount?: number | null;
  remaining_installments?: number | null;
  delivery_time?: string | null;
  description?: string | null;
  description_ar?: string | null;
  main_image?: string | null;
  main_image_meta?: MediaAsset | null;
  gallery?: string | string[];
  gallery_meta?: MediaAsset[] | null;
  beds?: string | null;
  size?: string | null;
  unit_type?: string | null;
  status?: string;
  meta_title?: string;
  meta_description?: string;
  submission_id?: number | null;
}

export interface ResaleSubmission {
  id: number;
  public_id?: string;
  owner_name: string;
  owner_email?: string | null;
  owner_phone: string;
  location: string;
  unit_type: string;
  beds: string;
  size: string;
  asking_price: string;
  paid_amount?: number | null;
  installment_value?: number | null;
  remaining_amount?: number | null;
  remaining_installments?: number | null;
  delivery_time?: string | null;
  description?: string | null;
  photos?: string | string[] | null;
  photos_meta?: MediaAsset[] | null;
  status: string;
  admin_notes?: string | null;
  created_at: string;
  listing?: { id: number; public_id: string; slug: string } | null;
}
