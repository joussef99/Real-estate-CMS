import { Request } from 'express';

function isAbsoluteHttpUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function getMetaUrl(meta: unknown): string | null {
  if (meta && typeof meta === 'object' && isAbsoluteHttpUrl((meta as { url?: unknown }).url)) {
    return (meta as { url: string }).url;
  }

  return null;
}

/**
 * Get the backend base URL from the request object
 * Respects trust proxy setup for production (Railway)
 */
export function getBackendBaseUrl(req: Request): string {
  // Environment variable takes priority
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  // Construct from request
  const protocol = req.protocol;
  const host = req.get('host');
  return `${protocol}://${host}`;
}

/**
 * Convert a relative path to an absolute backend URL.
 */
export function getFullImageUrl(req: Request, relativePath: string): string {
  const baseUrl = getBackendBaseUrl(req);
  // Remove leading slash if present
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${baseUrl}${path}`;
}

/**
 * Transform an object's image properties to full URLs
 */
export function transformImagesToFullUrls<T extends Record<string, any>>(
  req: Request,
  obj: T,
  imageFields: (keyof T)[] = ['main_image']
): T {
  const result = { ...obj };

  imageFields.forEach(field => {
    const metaField = `${String(field)}_meta`;
    const fallbackUrl = getMetaUrl((result as Record<string, unknown>)[metaField]);

    if (typeof result[field] === 'string') {
      const imagePath = result[field] as string;
      if (!isAbsoluteHttpUrl(imagePath)) {
        // Legacy relative paths are no longer served; prefer Cloudinary metadata if present.
        result[field] = fallbackUrl as any;
      }
      return;
    }

    if (!result[field] && fallbackUrl) {
      result[field] = fallbackUrl as any;
    }
  });

  return result;
}

/**
 * Transform gallery arrays to full URLs
 */
export function transformGalleryToFullUrls(req: Request, gallery: string | any[] | null | undefined, galleryMeta?: unknown): any[] {
  if (!gallery && !Array.isArray(galleryMeta)) return [];
  let galleryArray: any[] = [];

  if (typeof gallery === 'string') {
    try {
      galleryArray = JSON.parse(gallery);
    } catch {
      return [];
    }
  } else if (Array.isArray(gallery)) {
    galleryArray = gallery;
  }

  const directUrls = galleryArray.filter((item) => isAbsoluteHttpUrl(item));
  const metadataUrls = Array.isArray(galleryMeta)
    ? galleryMeta
        .map((item) => getMetaUrl(item))
        .filter((item): item is string => Boolean(item))
    : [];

  return Array.from(new Set([...directUrls, ...metadataUrls]));
}
