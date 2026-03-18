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

// GET all careers
router.get("/", safe((req, res) => {
  const careers = db.prepare("SELECT * FROM careers").all();
  res.json(careers);
}));

// CREATE career
router.post("/", authenticate, safe((req, res) => {
  const { title, location, type, description, requirements, apply_link } = req.body;
  const result = db.prepare("INSERT INTO careers (title, location, type, description, requirements, apply_link) VALUES (?, ?, ?, ?, ?, ?)").run(title, location, type, description, requirements, apply_link || null);
  res.json({ id: result.lastInsertRowid });
}));

// UPDATE career
router.put("/:id", authenticate, safe((req, res) => {
  const { title, location, type, description, requirements, apply_link } = req.body;
  db.prepare("UPDATE careers SET title=?, location=?, type=?, description=?, requirements=?, apply_link=? WHERE id=?").run(title, location, type, description, requirements, apply_link || null, req.params.id);
  res.json({ success: true });
}));

// DELETE career
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM careers WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
