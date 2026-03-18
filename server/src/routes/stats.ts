import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import { getStats } from "../controllers/statsController.ts";

const router = Router();

router.get("/", authenticate, requireAdmin, asyncHandler(getStats));

export default router;
