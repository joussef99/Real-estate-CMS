import type { SyntheticEvent } from "react";

export const FALLBACK_IMAGE_URL = "https://picsum.photos/seed/livin-fallback/1200/900";

export function resolveImageUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

export function cloudinaryOptimizedUrl(url: string | null | undefined, options?: { width?: number; height?: number; crop?: string }) {
  if (!url || !/^https?:\/\//i.test(url) || !url.includes("res.cloudinary.com")) {
    return url || null;
  }

  const { width, height, crop = "fill" } = options || {};
  const transforms = [
    width ? `w_${width}` : null,
    height ? `h_${height}` : null,
    crop ? `c_${crop}` : null,
    "q_auto",
    "f_auto",
  ].filter(Boolean).join(",");

  return url.replace("/upload/", `/upload/${transforms}/`);
}

export function withFallbackImage(event: SyntheticEvent<HTMLImageElement>, fallback = FALLBACK_IMAGE_URL) {
  const target = event.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
