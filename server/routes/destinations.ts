import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";
import { generateSlug } from "../utils/slug.ts";

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

const makeUniqueSlug = (baseName: string, currentId?: number): string => {
  let slug = generateSlug(baseName) || `destination-${Date.now()}`;
  const baseSlug = slug;
  let count = 1;

  while (true) {
    const existing = currentId
      ? db.prepare("SELECT id FROM destinations WHERE slug = ? AND id != ?").get(slug, currentId)
      : db.prepare("SELECT id FROM destinations WHERE slug = ?").get(slug);
    if (!existing) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

// GET all destinations
router.get("/", safe((req, res) => {
  const destinations = db.prepare(`
    SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
    FROM destinations d
  `).all();
  res.json(destinations);
}));

// GET projects by destination slug
router.get("/:slug/projects", safe((req, res) => {
  const destination = db.prepare("SELECT id, name, slug, image, description FROM destinations WHERE slug = ?").get(req.params.slug) as any;
  if (!destination) {
    return res.status(404).json({ error: "Destination not found" });
  }

  const projects = db.prepare(`
    SELECT
      p.id,
      p.name,
      p.location,
      p.price_range,
      p.type,
      p.main_image,
      p.developer_id,
      p.destination_id,
      p.beds,
      p.size,
      p.slug,
      d.name as developer_name,
      dest.name as destination_name,
      dest.slug as destination_slug
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    WHERE p.destination_id = ?
    ORDER BY p.id DESC
  `).all(destination.id);

  res.json({ destination, projects });
}));

// CREATE destination
router.post("/", authenticate, safe((req, res) => {
  const { name, image, description } = req.body;
  const slug = makeUniqueSlug(name);
  const result = db.prepare("INSERT INTO destinations (name, image, description, slug) VALUES (?, ?, ?, ?)").run(name, image, description, slug);
  res.json({ id: result.lastInsertRowid, slug });
}));

// UPDATE destination
router.put("/:id", authenticate, safe((req, res) => {
  const { name, image, description } = req.body;
  const slug = makeUniqueSlug(name, parseInt(req.params.id));
  db.prepare("UPDATE destinations SET name=?, image=?, description=?, slug=? WHERE id=?").run(name, image, description, slug, req.params.id);
  res.json({ success: true, slug });
}));

// DELETE destination
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM destinations WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
