import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

const safe = (handler: (req: Request, res: Response, next: NextFunction) => any) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: err?.message || "Internal Server Error" });
    }
  };
};

// POST lead (public endpoint)
router.post("/", safe((req, res) => {
  const { name, email, phone, message, project_id } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }
  
  const result = db.prepare("INSERT INTO leads (name, email, phone, message, project_id) VALUES (?, ?, ?, ?, ?)")
    .run(name, email, phone || null, message, project_id || null);
  res.json({ id: result.lastInsertRowid });
}));

// GET all leads (admin only)
router.get("/", authenticate, safe((req, res) => {
  const leads = db.prepare("SELECT l.*, p.name as project_name FROM leads l LEFT JOIN projects p ON l.project_id = p.id ORDER BY l.created_at DESC").all();
  res.json(leads);
}));

// DELETE lead (admin only)
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
