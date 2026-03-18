import { Router } from "express";
import { upload, uploadDeveloper, uploadDestination, uploadsDir, developerUploadsDir, destinationUploadsDir } from "../utils/uploads.ts";
import { optimizeAndSaveImage } from "../utils/imageOptimization.ts";
import { authenticate } from "../middleware/auth.ts";
import { getFullImageUrl } from "../utils/imageUrl.ts";

interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
}

const router = Router();

// POST /api/upload (upload multiple project images)
router.post("/", authenticate, upload.array('images', 10), async (req: any, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const uploadedPaths = await Promise.all(
      req.files.map((file: UploadedImageFile) =>
        optimizeAndSaveImage(file, uploadsDir, '/uploads', {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 70,
        }),
      ),
    );
    // Convert relative paths to full URLs
    const fullUrls = uploadedPaths.map(path => getFullImageUrl(req, path));
    res.json({ images: fullUrls });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/developer-logo (upload developer logo)
router.post("/developer-logo", authenticate, uploadDeveloper.single('logo'), async (req: any, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const logoPath = await optimizeAndSaveImage(req.file, developerUploadsDir, '/uploads/developers', {
      maxWidth: 600,
      maxHeight: 600,
      quality: 70,
    });
    const fullUrl = getFullImageUrl(req, logoPath);
    res.json({ logo: fullUrl });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/destination-image (upload destination image)
router.post("/destination-image", authenticate, uploadDestination.single('image'), async (req: any, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const imagePath = await optimizeAndSaveImage(req.file, destinationUploadsDir, '/uploads/destinations', {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 70,
    });
    const fullUrl = getFullImageUrl(req, imagePath);
    res.json({ image: fullUrl });
  } catch (error) {
    next(error);
  }
});

export default router;
