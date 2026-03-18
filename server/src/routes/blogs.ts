import { Router } from "express";
import { authenticate } from "../middleware/auth.ts";
import { asyncHandler } from "../middleware/errorHandler.ts";
import {
  createBlog,
  deleteBlog,
  getBlogByIdentifier,
  getBlogs,
  updateBlog,
} from "../controllers/blogsController.ts";

const router = Router();

router.get("/", asyncHandler(getBlogs));
router.get("/:identifier", asyncHandler(getBlogByIdentifier));
router.post("/", authenticate, asyncHandler(createBlog));
router.put("/:id", authenticate, asyncHandler(updateBlog));
router.delete("/:id", authenticate, asyncHandler(deleteBlog));

export default router;
