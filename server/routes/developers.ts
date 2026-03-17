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
  let slug = generateSlug(baseName) || `developer-${Date.now()}`;
  let baseSlug = slug;
  let count = 1;
  while (true) {
    const existing = currentId
      ? db.prepare("SELECT id FROM developers WHERE slug = ? AND id != ?").get(slug, currentId)
      : db.prepare("SELECT id FROM developers WHERE slug = ?").get(slug);
    if (!existing) break;
    slug = `${baseSlug}-${count++}`;
  }
  return slug;
};

// GET all developers
router.get("/", safe((req, res) => {
  const developers = db.prepare("SELECT * FROM developers").all();
  res.json(developers);
}));

// CREATE developer
router.post("/", authenticate, safe((req, res) => {
  const { name, logo, description } = req.body;
  const slug = makeUniqueSlug(name);
  const result = db.prepare("INSERT INTO developers (name, logo, description, slug) VALUES (?, ?, ?, ?)").run(name, logo, description, slug);
  res.json({ id: result.lastInsertRowid, slug });
}));

// UPDATE developer
router.put("/:id", authenticate, safe((req, res) => {
  const { name, logo, description } = req.body;
  const slug = makeUniqueSlug(name, parseInt(req.params.id));
  db.prepare("UPDATE developers SET name=?, logo=?, description=?, slug=? WHERE id=?").run(name, logo, description, slug, req.params.id);
  res.json({ success: true, slug });
}));

// DELETE developer
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM developers WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

// GET projects by developer slug
router.get("/:slug/projects", safe((req, res) => {
  const developer = db.prepare("SELECT id, name FROM developers WHERE slug = ?").get(req.params.slug) as any;
  if (!developer) {
    return res.status(404).json({ error: "Developer not found" });
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
    WHERE p.developer_id = ?
    ORDER BY p.id DESC
  `).all(developer.id);

  res.json(projects);
}));

export default router;
