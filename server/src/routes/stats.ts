import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

const safe = (handler: (req: Request, res: Response, next: NextFunction) => void | Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Internal Server Error" });
    }
  };
};

// GET stats
router.get("/", authenticate, safe((req, res) => {
  const projects = db.prepare("SELECT COUNT(*) as count FROM projects").get() as { count: number };
  const developers = db.prepare("SELECT COUNT(*) as count FROM developers").get() as { count: number };
  const destinations = db.prepare("SELECT COUNT(*) as count FROM destinations").get() as { count: number };
  const blogs = db.prepare("SELECT COUNT(*) as count FROM blogs").get() as { count: number };

  const stats = {
    projects: projects.count,
    developers: developers.count,
    destinations: destinations.count,
    blogs: blogs.count,
  };
  res.json(stats);
}));

export default router;
