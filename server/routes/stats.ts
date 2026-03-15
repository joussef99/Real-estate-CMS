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
  const stats = {
    projects: db.prepare("SELECT COUNT(*) as count FROM projects").get().count,
    developers: db.prepare("SELECT COUNT(*) as count FROM developers").get().count,
    destinations: db.prepare("SELECT COUNT(*) as count FROM destinations").get().count,
    blogs: db.prepare("SELECT COUNT(*) as count FROM blogs").get().count,
  };
  res.json(stats);
}));

export default router;
