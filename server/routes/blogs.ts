import { Router } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";
import { generateSlug } from "../utils/slug.ts";

const router = Router();

// GET all blogs
router.get("/", (req, res) => {
  const blogs = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC").all();
  res.json(blogs);
});

// GET single blog by slug (SEO-friendly URL)
router.get("/:slug", (req, res) => {
  const slug = req.params.slug;
  
  // Try to fetch by slug first
  let blog = db.prepare("SELECT * FROM blogs WHERE slug = ?").get(slug);
  
  // If not found, try by numeric ID for backward compatibility
  if (!blog && /^\d+$/.test(slug)) {
    blog = db.prepare("SELECT * FROM blogs WHERE id = ?").get(parseInt(slug));
  }
  
  if (!blog) return res.status(404).json({ error: "Not found" });
  res.json(blog);
});

// CREATE blog
router.post("/", authenticate, (req, res) => {
  const { title, content, image, category, author, meta_title, meta_description } = req.body;
  
  // Auto-generate slug and meta fields
  const slug = generateSlug(title);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || content.substring(0, 160) || `Read about ${title.toLowerCase()}.`;
  
  const result = db.prepare("INSERT INTO blogs (title, content, image, category, author, slug, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(title, content, image, category, author, slug, finalMetaTitle, finalMetaDescription);
  res.json({ id: result.lastInsertRowid, slug });
});

// UPDATE blog
router.put("/:id", authenticate, (req, res) => {
  const { title, content, image, category, author, meta_title, meta_description } = req.body;
  
  // Auto-generate slug and meta fields
  const slug = generateSlug(title);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || content.substring(0, 160) || `Read about ${title.toLowerCase()}.`;
  
  db.prepare("UPDATE blogs SET title=?, content=?, image=?, category=?, author=?, slug=?, meta_title=?, meta_description=? WHERE id=?").run(title, content, image, category, author, slug, finalMetaTitle, finalMetaDescription, req.params.id);
  res.json({ success: true, slug });
});

// DELETE blog
router.delete("/:id", authenticate, (req, res) => {
  db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

export default router;
