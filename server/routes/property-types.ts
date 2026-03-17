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

// GET all property types
router.get("/", safe((req, res) => {
  const propertyTypes = db.prepare("SELECT * FROM property_types ORDER BY name").all();
  res.json(propertyTypes);
}));

// CREATE property type
router.post("/", authenticate, safe((req, res) => {
  const { name } = req.body;
  const result = db.prepare("INSERT INTO property_types (name) VALUES (?)").run(name);
  res.json({ id: result.lastInsertRowid });
}));

// UPDATE property type
router.put("/:id", authenticate, safe((req, res) => {
  const { name } = req.body;
  db.prepare("UPDATE property_types SET name=? WHERE id=?").run(name, req.params.id);
  res.json({ success: true });
}));

// DELETE property type
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM property_types WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
