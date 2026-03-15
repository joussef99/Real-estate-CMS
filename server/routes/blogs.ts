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

const makeUniqueBlogSlug = (baseSlug: string, currentId?: number): string => {
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = currentId
      ? db.prepare("SELECT id FROM blogs WHERE slug = ? AND id != ?").get(slug, currentId)
      : db.prepare("SELECT id FROM blogs WHERE slug = ?").get(slug);

    if (!existing) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

// GET all blogs
router.get("/", safe((req, res) => {
  const blogs = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC").all();
  res.json(blogs);
}));

// GET single blog by ID or slug
router.get("/:identifier", safe((req, res) => {
  const identifier = req.params.identifier;

  if (!identifier) {
    return res.status(404).json({ error: "Not found" });
  }

  let blog;
  if (/^\d+$/.test(identifier)) {
    blog = db.prepare("SELECT * FROM blogs WHERE id = ?").get(parseInt(identifier));
  }

  if (!blog) {
    blog = db.prepare("SELECT * FROM blogs WHERE slug = ?").get(identifier);
  }

  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json(blog);
}));

// CREATE blog
router.post("/", authenticate, safe((req, res) => {
  const { title, content, image, category, author, slug, meta_title, meta_description } = req.body;
  
  const baseSlug = (slug && slug.trim()) || generateSlug(title);
  const finalSlug = makeUniqueBlogSlug(generateSlug(baseSlug));
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || content.substring(0, 160) || `Read about ${title.toLowerCase()}.`;
  
  const result = db.prepare("INSERT INTO blogs (title, content, image, category, author, slug, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(title, content, image, category, author, finalSlug, finalMetaTitle, finalMetaDescription);
  res.json({ id: result.lastInsertRowid, slug: finalSlug });
}));

// UPDATE blog
router.put("/:id", authenticate, safe((req, res) => {
  const { title, content, image, category, author, slug, meta_title, meta_description } = req.body;
  const blogId = parseInt(req.params.id);
  
  const baseSlug = (slug && slug.trim()) || generateSlug(title);
  const finalSlug = makeUniqueBlogSlug(generateSlug(baseSlug), blogId);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || content.substring(0, 160) || `Read about ${title.toLowerCase()}.`;
  
  db.prepare("UPDATE blogs SET title=?, content=?, image=?, category=?, author=?, slug=?, meta_title=?, meta_description=? WHERE id=?").run(title, content, image, category, author, finalSlug, finalMetaTitle, finalMetaDescription, blogId);
  res.json({ success: true });
}));

// DELETE blog
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
