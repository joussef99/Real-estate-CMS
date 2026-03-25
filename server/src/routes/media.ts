import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import { deleteImage } from "../services/mediaService.ts";

const router = Router();

router.use(authenticate, requireAdmin);

async function deleteTempMedia(req: any, res: any, next: any) {
  try {
    const rawPublicId = req.params.publicId ?? req.params[0];
    const publicId = typeof rawPublicId === "string" ? decodeURIComponent(rawPublicId).trim() : "";

    if (!publicId) {
      return res.status(400).json({ error: "public_id is required" });
    }

    await deleteImage(publicId);
    return res.json({ success: true, public_id: publicId });
  } catch (error) {
    return next(error);
  }
}

router.delete("/temp/:publicId", deleteTempMedia);
router.delete("/temp/*", deleteTempMedia);

export default router;