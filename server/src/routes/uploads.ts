import { Router } from "express";
import { upload, uploadDeveloper, uploadDestination } from "../utils/uploads.ts";
import { optimizeImageBuffer } from "../utils/imageOptimization.ts";
import { uploadImageBufferToCloudinary } from "../utils/cloudinaryUpload.ts";
import { authenticate, requireAdmin } from "../middleware/auth.ts";

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
    const uploadedUrls = await Promise.all(
      req.files.map(async (file: UploadedImageFile) => {
        const optimized = await optimizeImageBuffer(file, {
          maxWidth: 1200,
          maxHeight: 1200,
          quality: 70,
        });

        const uploaded = await uploadImageBufferToCloudinary(optimized.buffer, {
          folder: "livin/projects",
          public_id: `${optimized.safeName}-${Date.now()}`,
          resource_type: "image",
          overwrite: false,
        });

        return uploaded.secure_url;
      }),
    );
    res.json({ images: uploadedUrls });
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
    const optimized = await optimizeImageBuffer(req.file, {
      maxWidth: 600,
      maxHeight: 600,
      quality: 70,
    });

    const uploaded = await uploadImageBufferToCloudinary(optimized.buffer, {
      folder: "livin/developers",
      public_id: `${optimized.safeName}-${Date.now()}`,
      resource_type: "image",
      overwrite: false,
    });

    res.json({ logo: uploaded.secure_url });
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
    const optimized = await optimizeImageBuffer(req.file, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 70,
    });

    const uploaded = await uploadImageBufferToCloudinary(optimized.buffer, {
      folder: "livin/destinations",
      public_id: `${optimized.safeName}-${Date.now()}`,
      resource_type: "image",
      overwrite: false,
    });

    res.json({ image: uploaded.secure_url });
  } catch (error) {
    next(error);
  }
});

export default router;
