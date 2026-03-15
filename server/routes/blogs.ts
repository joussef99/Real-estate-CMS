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

// GET all blogs
router.get("/", safe((req, res) => {
  const blogs = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC").all();
  res.json(blogs);
}));

// GET single blog by slug (SEO-friendly URL) or numeric id
router.get("/:slug", safe((req, res) => {
  const identifier = req.params.slug;

  let blog = null;
  // Prefer numeric id lookups first (backward compatibility + avoids slug column issues)
  if (/^\d+$/.test(identifier)) {
    blog = db.prepare("SELECT * FROM blogs WHERE id = ?").get(parseInt(identifier));
  }

  if (!blog) {
    try {
      blog = db.prepare("SELECT * FROM blogs WHERE slug = ?").get(identifier);
    } catch (err: any) {
      // If slug column does not exist, fallback and ignore this error.
      if (!/no such column: slug/i.test(err?.message || '')) {
        throw err;
      }
    }
  }

  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json(blog);
}));

// CREATE blog
router.post("/", authenticate, safe((req, res) => {
  const { title, content, image, category, author, meta_title, meta_description } = req.body;
  
  // Auto-generate slug and meta fields
  const slug = generateSlug(title);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || content.substring(0, 160) || `Read about ${title.toLowerCase()}.`;
  
  const result = db.prepare("INSERT INTO blogs (title, content, image, category, author, slug, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(title, content, image, category, author, slug, finalMetaTitle, finalMetaDescription);
  res.json({ id: result.lastInsertRowid, slug });
}));

// UPDATE blog
router.put("/:id", authenticate, safe((req, res) => {
  const { title, content, image, category, author, meta_title, meta_description } = req.body;
  
  // Auto-generate slug and meta fields
  const slug = generateSlug(title);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || content.substring(0, 160) || `Read about ${title.toLowerCase()}.`;
  
  db.prepare("UPDATE blogs SET title=?, content=?, image=?, category=?, author=?, slug=?, meta_title=?, meta_description=? WHERE id=?").run(title, content, image, category, author, slug, finalMetaTitle, finalMetaDescription, req.params.id);
  res.json({ success: true, slug });
}));

// DELETE blog
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
