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

// GET all destinations
router.get("/", safe((req, res) => {
  const limit = parseInt(req.query.limit as string) || 0;
  const page = parseInt(req.query.page as string) || 1;
  const includeProjectPreviews = ['1', 'true'].includes(String(req.query.include_project_previews || '').toLowerCase());
  const previewLimit = parseInt(req.query.project_preview_limit as string) || 2;

  if (limit <= 0 && !req.query.page && !includeProjectPreviews) {
    const destinations = db.prepare(`
      SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
      FROM destinations d
    `).all();
    const transformedDestinations = (destinations as any[]).map(d => 
      transformImagesToFullUrls(req, d, ['image'])
    );
    return res.json(transformedDestinations);
  }

  const totalResult = db.prepare("SELECT COUNT(*) as count FROM destinations").get() as { count: number };
  const total = totalResult.count;
  const total_pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const destinations = (limit > 0
    ? db.prepare(`
        SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
        FROM destinations d
        ORDER BY d.id DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset)
    : db.prepare(`
        SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
        FROM destinations d
        ORDER BY d.id DESC
      `).all()) as Array<Record<string, any>>;

  const enrichedDestinations = includeProjectPreviews
    ? destinations.map((destination) => {
        const destWithImages = transformImagesToFullUrls(req, destination, ['image']);
        const previewProjects = db.prepare(`
          SELECT ${PROJECT_PREVIEW_SELECT}
          FROM projects p
          LEFT JOIN developers d ON p.developer_id = d.id
          LEFT JOIN destinations dest ON p.destination_id = dest.id
          WHERE p.destination_id = ?
          ORDER BY p.id DESC
          LIMIT ?
        `).all(destination.id, previewLimit) as any[];
        return {
          ...destWithImages,
          preview_projects: previewProjects.map(p => 
            transformImagesToFullUrls(req, p, ['main_image'])
          ),
        };
      })
    : destinations.map(d => transformImagesToFullUrls(req, d, ['image']));

  res.json({
    destinations: enrichedDestinations,
    total,
    total_pages,
    current_page: Math.max(page, 1),
    limit: limit || total,
  });
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
  `).all(destination.id) as any[];

  const destWithImages = transformImagesToFullUrls(req, destination, ['image']);
  const projectsWithImages = projects.map(p => 
    transformImagesToFullUrls(req, p, ['main_image'])
  );

  res.json({ destination: destWithImages, projects: projectsWithImages });
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
