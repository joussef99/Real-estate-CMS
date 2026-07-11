import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";

export type ResaleListingPayload = {
  title: string;
  location?: string | null;
  price?: string | null;
  paid_amount?: number | string | null;
  installment_value?: number | string | null;
  remaining_amount?: number | string | null;
  remaining_installments?: number | string | null;
  delivery_time?: string | null;
  description?: string | null;
  gallery?: string[];
  gallery_meta?: any[];
  main_image_meta?: any;
  beds?: string | null;
  size?: string | null;
  unit_type?: string | null;
  status?: string | null;
  slug?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

/**
 * Parses a value into a non-negative integer, or null if empty/absent.
 * Returns undefined if the value is present but not a valid non-negative number,
 * so callers can distinguish "invalid" from "not provided" during validation.
 */
export function toNullableNonNegativeInt(value: unknown): number | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return Math.round(parsed);
}

export async function makeUniqueResaleSlug(baseSlugCandidate: string, currentId?: number): Promise<string> {
  const baseSlug = generateSlug(baseSlugCandidate) || `resale-${Date.now()}`;
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await prisma.resaleListing.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
}

export function normalizeResaleListingPayload(payload: ResaleListingPayload, currentId?: number) {
  const gallery = Array.isArray(payload.gallery) ? payload.gallery : [];
  const galleryMeta = Array.isArray(payload.gallery_meta) ? payload.gallery_meta : [];
  const title = payload.title;
  const location = payload.location ?? null;
  const unit_type = payload.unit_type ?? null;

  const meta_title = payload.meta_title || `${title} - Resale ${String(unit_type || "unit")} in ${String(location || "Prime Location")}`;
  const meta_description = payload.meta_description ||
    (payload.description
      ? payload.description.substring(0, 160)
      : `Resale ${String(unit_type || "unit").toLowerCase()} available in ${String(location || "a prime location")}.`);

  const slugCandidate = (payload.slug && payload.slug.trim()) || payload.title || (currentId ? `resale-${currentId}` : `resale-${Date.now()}`);

  return {
    title,
    location,
    price: payload.price ?? null,
    // Validation already rejected malformed numeric values before this runs, so
    // an `undefined` result here can only mean "not provided" — safe to coerce to null.
    paid_amount: toNullableNonNegativeInt(payload.paid_amount) ?? null,
    installment_value: toNullableNonNegativeInt(payload.installment_value) ?? null,
    remaining_amount: toNullableNonNegativeInt(payload.remaining_amount) ?? null,
    remaining_installments: toNullableNonNegativeInt(payload.remaining_installments) ?? null,
    delivery_time: payload.delivery_time ?? null,
    description: payload.description ?? null,
    gallery: JSON.stringify(gallery),
    gallery_meta: galleryMeta,
    beds: payload.beds ?? null,
    size: payload.size ?? null,
    unit_type,
    status: payload.status === "unpublished" ? "unpublished" : "published",
    main_image: gallery.length > 0 ? gallery[0] : null,
    main_image_meta: payload.main_image_meta || galleryMeta[0] || null,
    meta_title,
    meta_description,
    slugCandidate,
  };
}
