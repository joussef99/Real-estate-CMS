import { Router } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";

const router = Router();

// GET all developers
router.get("/", (req, res) => {
  const developers = db.prepare("SELECT * FROM developers").all();
  res.json(developers);
});

// CREATE developer
router.post("/", authenticate, (req, res) => {
  const { name, logo, description } = req.body;
  const result = db.prepare("INSERT INTO developers (name, logo, description) VALUES (?, ?, ?)").run(name, logo, description);
  res.json({ id: result.lastInsertRowid });
});

// UPDATE developer
router.put("/:id", authenticate, (req, res) => {
  const { name, logo, description } = req.body;
  db.prepare("UPDATE developers SET name=?, logo=?, description=? WHERE id=?").run(name, logo, description, req.params.id);
  res.json({ success: true });
});

// DELETE developer
router.delete("/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM developers WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
