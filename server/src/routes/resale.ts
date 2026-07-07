import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import { uploadResalePhotos } from "../utils/uploads.ts";
import {
  createResaleSubmission,
  getResaleSubmissions,
  updateResaleSubmissionStatus,
  deleteResaleSubmission,
  getResaleListings,
  getResaleListingByIdentifier,
  getAdminResaleListings,
  getAdminResaleListingById,
  createResaleListing,
  updateResaleListing,
  deleteResaleListing,
} from "../controllers/resaleController.ts";

const router = Router();

// Public, unauthenticated + uploads images to Cloudinary — rate limit to curb abuse.
const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this address. Please try again later." },
});

// Public — browse published listings
router.get("/listings", asyncHandler(getResaleListings));
router.get("/listings/:identifier", asyncHandler(getResaleListingByIdentifier));

// Public — submit a unit for resale
router.post("/submissions", submissionLimiter, uploadResalePhotos.array("photos", 6), asyncHandler(createResaleSubmission));

// Admin — review submissions
router.get("/submissions", authenticate, requireAdmin, asyncHandler(getResaleSubmissions));
router.patch("/submissions/:id", authenticate, requireAdmin, asyncHandler(updateResaleSubmissionStatus));
router.delete("/submissions/:id", authenticate, requireAdmin, asyncHandler(deleteResaleSubmission));

// Admin — manage listings
router.get("/admin/listings", authenticate, requireAdmin, asyncHandler(getAdminResaleListings));
router.get("/admin/listings/:id", authenticate, requireAdmin, asyncHandler(getAdminResaleListingById));
router.post("/admin/listings", authenticate, requireAdmin, asyncHandler(createResaleListing));
router.put("/admin/listings/:id", authenticate, requireAdmin, asyncHandler(updateResaleListing));
router.delete("/admin/listings/:id", authenticate, requireAdmin, asyncHandler(deleteResaleListing));

export default router;
