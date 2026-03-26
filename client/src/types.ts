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
  slug?: string;
  preview_projects?: Project[];
}

export interface Destination {
  id: number;
  name: string;
  image: string;
  image_meta?: MediaAsset | null;
  description: string;
  slug?: string;
  project_count?: number;
  preview_projects?: Project[];
}

export interface Blog {
  id: number;
  title: string;
  slug?: string;
  content: string;
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
  requirements: string;
  apply_link?: string | null;
}
