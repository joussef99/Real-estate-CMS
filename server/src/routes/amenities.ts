import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createAmenity,
  deleteAmenity,
  getAmenities,
  updateAmenity,
} from "../controllers/amenitiesController.ts";

const router = Router();

router.get("/", asyncHandler(getAmenities));
router.post("/", authenticate, asyncHandler(createAmenity));
router.put("/:id", authenticate, asyncHandler(updateAmenity));
router.delete("/:id", authenticate, asyncHandler(deleteAmenity));

export default router;
