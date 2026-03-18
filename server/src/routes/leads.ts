import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createLead,
  deleteLead,
  getLeads,
} from "../controllers/leadsController.ts";

const router = Router();

router.post("/", asyncHandler(createLead));
router.get("/", authenticate, asyncHandler(getLeads));
router.delete("/:id", authenticate, asyncHandler(deleteLead));

export default router;
