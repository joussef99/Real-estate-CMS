import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createPropertyType,
  deletePropertyType,
  getPropertyTypes,
  updatePropertyType,
} from "../controllers/propertyTypesController.ts";

const router = Router();

router.get("/", asyncHandler(getPropertyTypes));
router.post("/", authenticate, asyncHandler(createPropertyType));
router.put("/:id", authenticate, asyncHandler(updatePropertyType));
router.delete("/:id", authenticate, asyncHandler(deletePropertyType));

export default router;
