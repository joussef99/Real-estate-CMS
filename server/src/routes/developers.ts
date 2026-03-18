import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createDeveloper,
  deleteDeveloper,
  getDeveloperProjects,
  getDevelopers,
  updateDeveloper,
} from "../controllers/developersController.ts";

const router = Router();

router.get("/", asyncHandler(getDevelopers));
router.post("/", authenticate, asyncHandler(createDeveloper));
router.put("/:id", authenticate, asyncHandler(updateDeveloper));
router.delete("/:id", authenticate, asyncHandler(deleteDeveloper));
router.get("/:slug/projects", asyncHandler(getDeveloperProjects));

export default router;
