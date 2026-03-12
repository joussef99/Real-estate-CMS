import { Router } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

// GET stats
router.get("/", authenticate, (req, res) => {
  const stats = {
    projects: db.prepare("SELECT COUNT(*) as count FROM projects").get().count,
    developers: db.prepare("SELECT COUNT(*) as count FROM developers").get().count,
    destinations: db.prepare("SELECT COUNT(*) as count FROM destinations").get().count,
    blogs: db.prepare("SELECT COUNT(*) as count FROM blogs").get().count,
  };
  res.json(stats);
});

export default router;
