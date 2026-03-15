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

// GET all destinations
router.get("/", safe((req, res) => {
  const destinations = db.prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
    FROM destinations d
  `).all();
  res.json(destinations);
}));

// CREATE destination
router.post("/", authenticate, safe((req, res) => {
  const { name, image, description } = req.body;
  const result = db.prepare("INSERT INTO destinations (name, image, description) VALUES (?, ?, ?)").run(name, image, description);
  res.json({ id: result.lastInsertRowid });
}));

// UPDATE destination
router.put("/:id", authenticate, safe((req, res) => {
  const { name, image, description } = req.body;
  db.prepare("UPDATE destinations SET name=?, image=?, description=? WHERE id=?").run(name, image, description, req.params.id);
  res.json({ success: true });
}));

// DELETE destination
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM destinations WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
