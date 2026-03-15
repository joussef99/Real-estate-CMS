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

// GET all amenities
router.get("/", safe((req, res) => {
  const amenities = db.prepare("SELECT * FROM amenities ORDER BY name").all();
  res.json(amenities);
}));

// CREATE amenity
router.post("/", authenticate, safe((req, res) => {
  const { name } = req.body;
  const result = db.prepare("INSERT INTO amenities (name) VALUES (?)").run(name);
  res.json({ id: result.lastInsertRowid });
}));

// UPDATE amenity
router.put("/:id", authenticate, safe((req, res) => {
  const { name } = req.body;
  db.prepare("UPDATE amenities SET name=? WHERE id=?").run(name, req.params.id);
  res.json({ success: true });
}));

// DELETE amenity
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM amenities WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
