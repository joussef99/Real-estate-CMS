import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";

export type PropertyPayload = {
  name: string;
  location?: string | null;
  price_range?: string | null;
  type?: string | null;
  status?: string | null;
  description?: string | null;
  gallery?: string[];
  amenities?: number[];
  developer_id?: number | null;
  destination_id?: number | null;
  is_featured?: boolean | number;
  featured?: boolean | number;
  beds?: string | null;
  size?: string | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

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
  const featuredValue = payload.featured !== undefined
    ? (payload.featured ? 1 : 0)
    : (payload.is_featured ? 1 : 0);

  const gallery = Array.isArray(payload.gallery) ? payload.gallery : [];
  const name = payload.name;
  const location = payload.location ?? null;
  const type = payload.type ?? null;

  const meta_title = payload.meta_title || `${name} - Luxury ${String(type || "property")} in ${String(location || "Prime Location")}`;
  const meta_description = payload.meta_description ||
    (payload.description
      ? payload.description.substring(0, 160)
      : `Discover ${name}, a premium ${String(type || "property").toLowerCase()} property in ${String(location || "a prime location")}.`);

  const slugCandidate = (payload.slug && payload.slug.trim()) || payload.name || (currentId ? `project-${currentId}` : `project-${Date.now()}`);

  return {
    name,
    location,
    price_range: payload.price_range ?? null,
    type,
    status: payload.status ?? null,
    description: payload.description ?? null,
    gallery: JSON.stringify(gallery),
    developer_id: payload.developer_id ? Number(payload.developer_id) : null,
    destination_id: payload.destination_id ? Number(payload.destination_id) : null,
    is_featured: payload.is_featured ? 1 : 0,
    featured: featuredValue,
    beds: payload.beds ?? null,
    size: payload.size ?? null,
    main_image: gallery.length > 0 ? gallery[0] : null,
    meta_title,
    meta_description,
    slugCandidate,
    amenities: Array.isArray(payload.amenities) ? payload.amenities.map((id) => Number(id)).filter(Number.isFinite) : [],
  };
}
