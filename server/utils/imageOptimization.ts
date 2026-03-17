import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
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
) {
  fs.mkdirSync(targetDir, { recursive: true });

  const safeName = sanitizeFileName(file.originalname) || 'image';
  const fileName = `${safeName}-${Date.now()}.webp`;
  const outputPath = path.join(targetDir, fileName);

  await sharp(file.buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 78, effort: 5 })
    .toFile(outputPath);

  return `${publicBasePath}/${fileName}`;
}