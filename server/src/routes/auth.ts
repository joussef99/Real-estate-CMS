import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import { changePassword, login } from "../controllers/authController.ts";

const router = Router();

router.post("/login", asyncHandler(login));
router.post("/change-password", authenticate, asyncHandler(changePassword));

export default router;
