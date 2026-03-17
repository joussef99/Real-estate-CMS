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
  type: string;
  status: string;
  description: string;
  main_image: string;
  gallery: string; // JSON string
  amenities: string; // JSON string
  developer_id: number;
  destination_id: number;
  is_featured: number;
  beds: string;
  size: string;
  developer_name?: string;
  slug?: string;
  meta_title?: string;
  meta_description?: string;
  destination_name?: string;
}

export interface Developer {
  id: number;
  name: string;
  logo: string;
  description: string;
  slug?: string;
}

export interface Destination {
  id: number;
  name: string;
  image: string;
  description: string;
  project_count?: number;
}

export interface Blog {
  id: number;
  title: string;
  slug?: string;
  content: string;
  image: string;
  category: string;
  author: string;
  created_at: string;
  meta_title?: string;
  meta_description?: string;
}

export interface Career {
  id: number;
  title: string;
  location: string;
  type: string;
  description: string;
  requirements: string;
}
