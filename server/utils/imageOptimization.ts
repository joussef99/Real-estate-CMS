import fs from 'fs';
import path from 'path';
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

export async function optimizeAndSaveImage(
  file: UploadedImageFile,
  targetDir: string,
  publicBasePath: string,
  options: OptimizeImageOptions,
) {
  fs.mkdirSync(targetDir, { recursive: true });

  const safeName = sanitizeFileName(file.originalname) || 'image';
  const fileName = `${safeName}-${Date.now()}.webp`;
  const outputPath = path.join(targetDir, fileName);

  const { maxWidth, maxHeight, quality = 70 } = options;

  await sharp(file.buffer)
    .rotate()
    .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
    .webp({ quality, effort: 4 })
    .toFile(outputPath);

  return `${publicBasePath}/${fileName}`;
}