import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls } from "../utils/imageUrl.ts";

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

const PROJECT_PREVIEW_SELECT = `
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
`;

const DEVELOPER_LIST_SELECT = "id, name, logo, description, slug";

// GET all developers
router.get("/", safe((req, res) => {
  const limit = parseInt(req.query.limit as string) || 0;
  const page = parseInt(req.query.page as string) || 1;
  const includeProjectPreviews = ['1', 'true'].includes(String(req.query.include_project_previews || '').toLowerCase());
  const previewLimit = parseInt(req.query.project_preview_limit as string) || 2;

  if (limit <= 0 && !req.query.page && !includeProjectPreviews) {
    const developers = db.prepare(`SELECT ${DEVELOPER_LIST_SELECT} FROM developers`).all();
    const transformedDevelopers = (developers as any[]).map(d => 
      transformImagesToFullUrls(req, d, ['logo'])
    );
    return res.json(transformedDevelopers);
  }

  const totalResult = db.prepare("SELECT COUNT(*) as count FROM developers").get() as { count: number };
  const total = totalResult.count;
  const total_pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const developers = (limit > 0
    ? db.prepare(`SELECT ${DEVELOPER_LIST_SELECT} FROM developers ORDER BY id DESC LIMIT ? OFFSET ?`).all(limit, offset)
    : db.prepare(`SELECT ${DEVELOPER_LIST_SELECT} FROM developers ORDER BY id DESC`).all()) as Array<Record<string, any>>;

  const enrichedDevelopers = includeProjectPreviews
    ? developers.map((developer) => {
        const devWithImages = transformImagesToFullUrls(req, developer, ['logo']);
        const previewProjects = db.prepare(`
          SELECT ${PROJECT_PREVIEW_SELECT}
          FROM projects p
          LEFT JOIN developers d ON p.developer_id = d.id
          LEFT JOIN destinations dest ON p.destination_id = dest.id
          WHERE p.developer_id = ?
          ORDER BY p.id DESC
          LIMIT ?
        `).all(developer.id, previewLimit) as any[];
        return {
          ...devWithImages,
          preview_projects: previewProjects.map(p => 
            transformImagesToFullUrls(req, p, ['main_image'])
          ),
        };
      })
    : developers.map(d => transformImagesToFullUrls(req, d, ['logo']));

  res.json({
    developers: enrichedDevelopers,
    total,
    total_pages,
    current_page: Math.max(page, 1),
    limit: limit || total,
  });
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
  `).all(developer.id) as any[];

  const projectsWithImages = projects.map(p => 
    transformImagesToFullUrls(req, p, ['main_image'])
  );

  res.json(projectsWithImages);
}));

export default router;
