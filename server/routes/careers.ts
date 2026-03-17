import { Router } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

// GET all careers
router.get("/", (req, res) => {
  const careers = db.prepare("SELECT * FROM careers").all();
  res.json(careers);
});

// CREATE career
router.post("/", authenticate, (req, res) => {
  const { title, location, type, description, requirements, apply_link } = req.body;
  const result = db.prepare("INSERT INTO careers (title, location, type, description, requirements, apply_link) VALUES (?, ?, ?, ?, ?, ?)").run(title, location, type, description, requirements, apply_link || null);
  res.json({ id: result.lastInsertRowid });
});

// UPDATE career
router.put("/:id", authenticate, (req, res) => {
  const { title, location, type, description, requirements, apply_link } = req.body;
  db.prepare("UPDATE careers SET title=?, location=?, type=?, description=?, requirements=?, apply_link=? WHERE id=?").run(title, location, type, description, requirements, apply_link || null, req.params.id);
  res.json({ success: true });
});

// DELETE career
router.delete("/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM careers WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
