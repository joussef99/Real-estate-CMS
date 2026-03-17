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

const BLOG_LIST_SELECT = "id, title, image, category, author, created_at, slug";

// GET all blogs
router.get("/", safe((req, res) => {
  const limit = parseInt(req.query.limit as string) || 0;
  const page = parseInt(req.query.page as string) || 1;

  if (limit <= 0 && !req.query.page) {
    const blogs = db.prepare(`SELECT ${BLOG_LIST_SELECT} FROM blogs ORDER BY created_at DESC`).all();
    return res.json(blogs);
  }

  const totalResult = db.prepare("SELECT COUNT(*) as count FROM blogs").get() as { count: number };
  const total = totalResult.count;
  const total_pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const blogs = limit > 0
    ? db.prepare(`SELECT ${BLOG_LIST_SELECT} FROM blogs ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(limit, offset)
    : db.prepare(`SELECT ${BLOG_LIST_SELECT} FROM blogs ORDER BY created_at DESC`).all();

  res.json({
    blogs,
    total,
    total_pages,
    current_page: Math.max(page, 1),
    limit: limit || total,
  });
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

  const baseSlugCandidate = (slug && slug.trim()) || title;
  const baseSlug = generateSlug(baseSlugCandidate || `blog-${Date.now()}`);
  const finalSlug = makeUniqueBlogSlug(baseSlug);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || (content ? content.substring(0, 160) : `Read about ${title.toLowerCase()}.`);

  const result = db.prepare("INSERT INTO blogs (title, content, image, category, author, slug, meta_title, meta_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(title, content, image, category, author, finalSlug, finalMetaTitle, finalMetaDescription);
  res.json({ id: result.lastInsertRowid, slug: finalSlug });
}));

// UPDATE blog
router.put("/:id", authenticate, safe((req, res) => {
  const { title, content, image, category, author, slug, meta_title, meta_description } = req.body;
  const blogId = parseInt(req.params.id);

  const baseSlugCandidate = (slug && slug.trim()) || title;
  const baseSlug = generateSlug(baseSlugCandidate || `blog-${Date.now()}`);
  const finalSlug = makeUniqueBlogSlug(baseSlug, blogId);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || (content ? content.substring(0, 160) : `Read about ${title.toLowerCase()}.`);

  db.prepare("UPDATE blogs SET title=?, content=?, image=?, category=?, author=?, slug=?, meta_title=?, meta_description=? WHERE id=?").run(title, content, image, category, author, finalSlug, finalMetaTitle, finalMetaDescription, blogId);
  res.json({ success: true });
}));

// DELETE blog
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
