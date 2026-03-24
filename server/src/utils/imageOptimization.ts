import sharp from 'sharp';

interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
}

interface OptimizeImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
}

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export async function optimizeImageBuffer(
  file: UploadedImageFile,
  options: OptimizeImageOptions,
) {
  // Keep deterministic naming support for Cloudinary public IDs.
  const safeName = sanitizeFileName(file.originalname) || 'image';
  const { maxWidth, maxHeight, quality = 70 } = options;

  const buffer = await sharp(file.buffer)
    .rotate()
    .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toBuffer();

  return {
    buffer,
    safeName,
  };
}