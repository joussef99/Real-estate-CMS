import { getCloudinary } from "../config/cloudinary.ts";
import { optimizeImageBuffer } from "../utils/imageOptimization.ts";
import { uploadImageBufferToCloudinary } from "../utils/cloudinaryUpload.ts";

export type MediaAsset = {
  url: string;
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
};

type UploadedImageFile = {
  buffer: Buffer;
  originalname: string;
};

type UploadImageOptions = {
  folder: string;
  maxWidth: number;
  maxHeight: number;
  quality?: number;
};

export async function uploadImage(file: UploadedImageFile, options: UploadImageOptions): Promise<MediaAsset> {
  const optimized = await optimizeImageBuffer(file, {
    maxWidth: options.maxWidth,
    maxHeight: options.maxHeight,
    quality: options.quality ?? 72,
  });

  const uploaded = await uploadImageBufferToCloudinary(optimized.buffer, {
    folder: options.folder,
    public_id: `${optimized.safeName}-${Date.now()}`,
    resource_type: "image",
    overwrite: false,
  });

  return {
    url: uploaded.secure_url,
    secure_url: uploaded.secure_url,
    public_id: uploaded.public_id,
    width: uploaded.width,
    height: uploaded.height,
    format: uploaded.format,
  };
}

export async function deleteImage(publicId?: string | null): Promise<void> {
  if (!publicId) return;

  const cloudinary = getCloudinary();
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}

export async function deleteImages(publicIds: Iterable<string | null | undefined>): Promise<void> {
  const uniquePublicIds = Array.from(new Set(Array.from(publicIds).filter((publicId): publicId is string => Boolean(publicId))));
  if (uniquePublicIds.length === 0) return;

  const results = await Promise.allSettled(uniquePublicIds.map((publicId) => deleteImage(publicId)));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      process.stderr.write(
        `[WARN] Failed to delete Cloudinary asset ${uniquePublicIds[index]}: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}\n`,
      );
    }
  });
}

export function getPublicIdFromMedia(value: any): string | null {
  if (!value) return null;

  if (typeof value === "object" && value !== null && typeof value.public_id === "string") {
    return value.public_id;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed.public_id === "string") {
        return parsed.public_id;
      }
    } catch {
      // ignore non-json
    }

    // Best-effort fallback for Cloudinary URLs.
    const marker = "/upload/";
    const markerIndex = trimmed.indexOf(marker);
    if (markerIndex !== -1) {
      const pathAfterUpload = trimmed.slice(markerIndex + marker.length);
      const withoutVersion = pathAfterUpload.replace(/^v\d+\//, "");
      const withoutExtension = withoutVersion.replace(/\.[a-zA-Z0-9]+$/, "");
      return withoutExtension || null;
    }
  }

  return null;
}

export function getPublicIdsFromMediaCollection(value: any): string[] {
  const publicIds = new Set<string>();

  const collect = (input: any) => {
    if (!input) return;

    if (Array.isArray(input)) {
      input.forEach(collect);
      return;
    }

    if (typeof input === "string") {
      const trimmed = input.trim();
      if (!trimmed) return;

      try {
        const parsed = JSON.parse(trimmed);
        if (parsed !== input) {
          collect(parsed);
        }
      } catch {
        // ignore non-json strings
      }

      const publicId = getPublicIdFromMedia(trimmed);
      if (publicId) {
        publicIds.add(publicId);
      }
      return;
    }

    const publicId = getPublicIdFromMedia(input);
    if (publicId) {
      publicIds.add(publicId);
    }
  };

  collect(value);
  return Array.from(publicIds);
}
