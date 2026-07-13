import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";

export type PropertyPayload = {
  name: string;
  location?: string | null;
  price_min?: number | string | null;
  price_max?: number | string | null;
  downPayment?: number | string | null;
  type?: string | null;
  status?: string | null;
  description?: string | null;
  gallery?: string[];
  gallery_meta?: any[];
  main_image_meta?: any;
  amenities?: number[];
  developer_id?: number | null;
  destination_id?: number | null;
  is_featured?: boolean | number;
  featured?: boolean | number;
  beds?: string | null;
  size_min?: number | string | null;
  size_max?: number | string | null;
  installment_years?: number | string | null;
  delivery_time?: string | null;
  finishing_status?: string | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

function toNullableNonNegativeInt(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
}

export async function makeUniqueProjectSlug(baseSlugCandidate: string, currentId?: number): Promise<string> {
  const baseSlug = generateSlug(baseSlugCandidate) || `project-${Date.now()}`;
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
}

export function normalizePropertyPayload(payload: PropertyPayload, currentId?: number) {
  // `is_featured` is the single source of truth. `featured` is a legacy duplicate
  // column kept in sync here rather than derived independently, since two
  // independent derivations let them drift apart (e.g. a caller sending only
  // one of the two fields).
  const isFeaturedValue = payload.is_featured ? 1 : 0;

  const gallery = Array.isArray(payload.gallery) ? payload.gallery : [];
  const galleryMeta = Array.isArray(payload.gallery_meta) ? payload.gallery_meta : [];
  const name = payload.name;
  const location = payload.location ?? null;
  const type = payload.type ?? null;

  const meta_title = payload.meta_title || `${name} - Luxury ${String(type || "property")} in ${String(location || "Prime Location")}`;
  const meta_description = payload.meta_description ||
    (payload.description
      ? payload.description.substring(0, 160)
      : `Discover ${name}, a premium ${String(type || "property").toLowerCase()} property in ${String(location || "a prime location")}.`);

  const slugCandidate = (payload.slug && payload.slug.trim()) || payload.name || (currentId ? `project-${currentId}` : `project-${Date.now()}`);
  const downPayment = toNullableNonNegativeInt(payload.downPayment);
  const installment_years = toNullableNonNegativeInt(payload.installment_years);
  const size_min = toNullableNonNegativeInt(payload.size_min);
  const size_max = toNullableNonNegativeInt(payload.size_max);
  const price_min = toNullableNonNegativeInt(payload.price_min);
  const price_max = toNullableNonNegativeInt(payload.price_max);

  return {
    name,
    location,
    price_min,
    price_max,
    downPayment,
    type,
    status: payload.status ?? null,
    description: payload.description ?? null,
    gallery: JSON.stringify(gallery),
    gallery_meta: galleryMeta,
    developer_id: payload.developer_id ? Number(payload.developer_id) : null,
    destination_id: payload.destination_id ? Number(payload.destination_id) : null,
    is_featured: isFeaturedValue,
    featured: isFeaturedValue,
    beds: payload.beds ?? null,
    size_min,
    size_max,
    installment_years,
    delivery_time: payload.delivery_time ?? null,
    finishing_status: payload.finishing_status ?? null,
    main_image: gallery.length > 0 ? gallery[0] : null,
    main_image_meta: payload.main_image_meta || galleryMeta[0] || null,
    meta_title,
    meta_description,
    slugCandidate,
    amenities: Array.isArray(payload.amenities) ? payload.amenities.map((id) => Number(id)).filter(Number.isFinite) : [],
  };
}
