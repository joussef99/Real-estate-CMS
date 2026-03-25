import { Router } from "express";
import { upload, uploadDeveloper, uploadDestination } from "../utils/uploads.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import { deleteImage, getPublicIdFromMedia, uploadImage } from "../services/mediaService.ts";

interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
}

const router = Router();

router.use(authenticate, requireAdmin);

// POST /api/upload (upload multiple project images)
router.post("/", upload.array('images', 10), async (req: any, res, next) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }

  try {
    const uploadedAssets = await Promise.all(
      req.files.map(async (file: UploadedImageFile) => {
        return uploadImage(file, {
          folder: "projects",
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 72,
        });
      }),
    );

    const legacyUrls = uploadedAssets.map((asset) => asset.url);
    res.json({
      images: legacyUrls,
      gallery_meta: uploadedAssets,
      assets: uploadedAssets,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/developer-logo (upload developer logo)
router.post("/developer-logo", uploadDeveloper.single('logo'), async (req: any, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const asset = await uploadImage(req.file, {
      folder: "developers",
      maxWidth: 600,
      maxHeight: 600,
      quality: 72,
    });

    res.json({ logo: asset.url, asset });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/destination-image (upload destination image)
router.post("/destination-image", uploadDestination.single('image'), async (req: any, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const asset = await uploadImage(req.file, {
      folder: "destinations",
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 72,
    });

    res.json({ image: asset.url, asset });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/blog-image (upload blog cover image)
router.post("/blog-image", uploadDestination.single('image'), async (req: any, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const asset = await uploadImage(req.file, {
      folder: "blogs",
      maxWidth: 1600,
      maxHeight: 1600,
      quality: 72,
    });

    res.json({ image: asset.url, asset });
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/delete (manual admin cleanup)
router.post("/delete", async (req: any, res, next) => {
  try {
    const publicId = getPublicIdFromMedia(req.body?.media || req.body?.public_id);
    if (!publicId) {
      return res.status(400).json({ error: "public_id is required" });
    }

    await deleteImage(publicId);
    res.json({ success: true, public_id: publicId });
  } catch (error) {
    next(error);
  }
});

export default router;
