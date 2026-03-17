interface OptimizeImageOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number;
  fileNamePrefix?: string;
}

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file.'));
    };

    image.src = objectUrl;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to optimize image.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality,
    );
  });

export async function optimizeImageFile(file: File, options: OptimizeImageOptions) {
  const { maxWidth, maxHeight, quality = 0.82, fileNamePrefix = 'image' } = options;
  const image = await loadImage(file);

  const widthRatio = maxWidth / image.width;
  const heightRatio = maxHeight / image.height;
  const resizeRatio = Math.min(1, widthRatio, heightRatio);

  const targetWidth = Math.max(1, Math.round(image.width * resizeRatio));
  const targetHeight = Math.max(1, Math.round(image.height * resizeRatio));

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas is not available for image processing.');
  }

  context.drawImage(image, 0, 0, targetWidth, targetHeight);

  const blob = await canvasToBlob(canvas, quality);
  const optimizedName = `${fileNamePrefix}-${Date.now()}.webp`;

  return new File([blob], optimizedName, {
    type: 'image/webp',
    lastModified: Date.now(),
  });
}

export async function optimizeImageFiles(files: FileList | File[], options: OptimizeImageOptions) {
  return Promise.all(Array.from(files).map((file) => optimizeImageFile(file, options)));
}