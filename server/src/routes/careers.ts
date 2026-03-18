import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createCareer,
  deleteCareer,
  getCareers,
  updateCareer,
} from "../controllers/careersController.ts";

const router = Router();

router.get("/", asyncHandler(getCareers));
router.post("/", authenticate, asyncHandler(createCareer));
router.put("/:id", authenticate, asyncHandler(updateCareer));
router.delete("/:id", authenticate, asyncHandler(deleteCareer));

export default router;
