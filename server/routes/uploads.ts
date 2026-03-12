import { Router } from "express";
import { upload, uploadDeveloper, uploadDestination, uploadsDir, developerUploadsDir, destinationUploadsDir } from "../utils/uploads.ts";

const router = Router();

// POST /api/upload (upload multiple project images)
router.post("/", upload.array('images', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "No files uploaded" });
  }
  
  const uploadedPaths = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ images: uploadedPaths });
});

// POST /api/upload/developer-logo (upload developer logo)
router.post("/developer-logo", uploadDeveloper.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const logoPath = `/uploads/developers/${req.file.filename}`;
  res.json({ logo: logoPath });
});

// POST /api/upload/destination-image (upload destination image)
router.post("/destination-image", uploadDestination.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  const imagePath = `/uploads/destinations/${req.file.filename}`;
  res.json({ image: imagePath });
});

export default router;
