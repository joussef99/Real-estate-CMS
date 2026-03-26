import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createDestination,
  deleteDestination,
  getDestinationProjects,
  getDestinations,
  updateDestination,
} from "../controllers/destinationsController.ts";

const router = Router();

router.get("/", asyncHandler(getDestinations));
router.get("/:identifier/projects", asyncHandler(getDestinationProjects));
router.post("/", authenticate, asyncHandler(createDestination));
router.put("/:id", authenticate, asyncHandler(updateDestination));
router.delete("/:id", authenticate, asyncHandler(deleteDestination));

export default router;
