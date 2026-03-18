import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createProject,
  deleteProject,
  duplicateProject,
  getFeaturedProjects,
  getProjectAmenities,
  getProjectByIdentifier,
  getProjectGallery,
  getProjects,
  searchProjects,
  updateProject,
} from "../controllers/projectsController.ts";

const router = Router();
router.get("/", asyncHandler(getProjects));
router.get("/search", asyncHandler(searchProjects));
router.get("/featured", asyncHandler(getFeaturedProjects));
router.get("/:identifier/amenities", asyncHandler(getProjectAmenities));
router.get("/:identifier/gallery", asyncHandler(getProjectGallery));
router.get("/:identifier", asyncHandler(getProjectByIdentifier));
router.post("/", authenticate, asyncHandler(createProject));
router.put("/:id", authenticate, asyncHandler(updateProject));
router.post("/:id/duplicate", authenticate, asyncHandler(duplicateProject));
router.delete("/:id", authenticate, asyncHandler(deleteProject));

export default router;
