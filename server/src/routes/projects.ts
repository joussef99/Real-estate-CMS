import { Router, Request, Response, NextFunction } from "express";
import { db } from "../db/database.ts";
import { authenticate } from "../middleware/auth.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls, transformGalleryToFullUrls, getFullImageUrl } from "../utils/imageUrl.ts";

const router = Router();

const PROJECT_CARD_SELECT = `
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

const toPositiveInteger = (value: unknown) => {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toNullableNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getProjectPriceBounds = (priceRange?: string | null) => {
  if (!priceRange) {
    return { min: null as number | null, max: null as number | null };
  }

  const regex = /(\d+(?:[.,]\d+)?)\s*([kmb])?/gi;
  const values: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(priceRange)) !== null) {
    const normalizedNumber = match[1].replace(/,/g, "");
    let value = parseFloat(normalizedNumber);

    if (!Number.isFinite(value)) continue;

    switch ((match[2] || "").toLowerCase()) {
      case "b":
        value *= 1000000000;
        break;
      case "m":
        value *= 1000000;
        break;
      case "k":
        value *= 1000;
        break;
      default:
        break;
    }

    values.push(value);
  }

  if (!values.length) {
    return { min: null as number | null, max: null as number | null };
  }

  return {
    min: values[0] ?? null,
    max: values[values.length - 1] ?? values[0] ?? null,
  };
};

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

const makeUniqueSlug = (baseSlug: string, currentId?: number): string => {
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = currentId
      ? db.prepare("SELECT id FROM projects WHERE slug = ? AND id != ?").get(slug, currentId)
      : db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug);

    if (!existing) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

// Helper to resolve project by id or slug
const resolveProject = (identifier: string) => {
  if (!identifier) return null;

  if (/^\d+$/.test(identifier)) {
    return db.prepare("SELECT * FROM projects WHERE id = ?").get(parseInt(identifier));
  }

  return db.prepare("SELECT * FROM projects WHERE slug = ?").get(identifier);
};

// GET all projects with optional pagination and developer_id filter
router.get("/", safe((req, res) => {
  const limit = parseInt(req.query.limit as string) || 1000;
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * limit;
  const developer_id = req.query.developer_id ? parseInt(req.query.developer_id as string) : null;

  // Get total count (with optional developer filter)
  const totalResult = developer_id
    ? db.prepare("SELECT COUNT(*) as count FROM projects WHERE developer_id = ?").get(developer_id) as any
    : db.prepare("SELECT COUNT(*) as count FROM projects").get() as any;
  const total = totalResult.count;
  const total_pages = Math.ceil(total / limit);

  // Validate page
  if (page < 1 || page > Math.max(total_pages, 1)) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  // Get paginated projects with newest first (with optional developer filter)
  const projects = developer_id
    ? db.prepare(`
        SELECT ${PROJECT_CARD_SELECT}
        FROM projects p
        LEFT JOIN developers d ON p.developer_id = d.id
        LEFT JOIN destinations dest ON p.destination_id = dest.id
        WHERE p.developer_id = ?
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `).all(developer_id, limit, offset)
    : db.prepare(`
        SELECT ${PROJECT_CARD_SELECT}
        FROM projects p
        LEFT JOIN developers d ON p.developer_id = d.id
        LEFT JOIN destinations dest ON p.destination_id = dest.id
        ORDER BY p.id DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

  // Transform relative image URLs to absolute URLs
  const transformedProjects = projects.map((p: any) => 
    transformImagesToFullUrls(req, p, ['main_image'])
  );

  res.json({
    projects: transformedProjects,
    total_pages,
    current_page: page,
    total,
    limit
  });
}));

// SEARCH projects with advanced filters
router.get("/search", safe((req, res) => {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 48);
  const offset = (page - 1) * limit;

  // Extract filters
  const destination_id = toPositiveInteger(req.query.destination ?? req.query.destination_id);
  const developer_id = toPositiveInteger(req.query.developer ?? req.query.developer_id);
  const property_type = String(req.query.property_type ?? req.query.types ?? "").split(",").map((value) => value.trim()).find(Boolean) || null;
  const price_min = toNullableNumber(req.query.price_min);
  const price_max = toNullableNumber(req.query.price_max);
  const bedrooms = req.query.bedrooms as string || null;
  const amenities = req.query.amenities ? (req.query.amenities as string).split(',').map(a => parseInt(a)) : null;
  const keyword = String(req.query.keyword ?? req.query.q ?? '').trim();

  // Build WHERE clause dynamically
  const whereConditions: string[] = [];
  const params: any[] = [];

  if (keyword) {
    whereConditions.push("(p.name LIKE ? OR p.location LIKE ? OR p.type LIKE ? OR d.name LIKE ? OR dest.name LIKE ?)");
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  if (destination_id) {
    whereConditions.push("p.destination_id = ?");
    params.push(destination_id);
  }

  if (developer_id) {
    whereConditions.push("p.developer_id = ?");
    params.push(developer_id);
  }

  if (property_type) {
    whereConditions.push("p.type = ?");
    params.push(property_type);
  }

  if (bedrooms) {
    whereConditions.push("p.beds LIKE ?");
    params.push(`%${bedrooms}%`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  let mainQuery = `
    SELECT DISTINCT ${PROJECT_CARD_SELECT}
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    ${whereClause}
    ORDER BY p.id DESC
  `;

  let projects = db.prepare(mainQuery).all(...params) as Array<Record<string, any>>;

  // If amenities filter is provided, fetch and filter separately
  if (amenities && amenities.length > 0) {
    projects = projects.filter(project => {
      const projectAmenities = db.prepare(`
        SELECT amenity_id FROM project_amenities WHERE project_id = ?
      `).all(project.id) as any;
      
      const projectAmenityIds = projectAmenities.map(pa => pa.amenity_id);
      return amenities.every(amenity_id => projectAmenityIds.includes(amenity_id));
    });
  }

  if (price_min !== null || price_max !== null) {
    projects = projects.filter((project) => {
      const { min, max } = getProjectPriceBounds(project.price_range as string | null);
      const lowerBound = min ?? max;
      const upperBound = max ?? min;

      if (lowerBound === null || upperBound === null) {
        return false;
      }

      if (price_min !== null && upperBound < price_min) {
        return false;
      }

      if (price_max !== null && lowerBound > price_max) {
        return false;
      }

      return true;
    });
  }

  const total = projects.length;
  const total_pages = Math.max(Math.ceil(total / limit), 1);

  if (page > total_pages && total > 0) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  const paginatedProjects = projects.slice(offset, offset + limit);
  
  // Transform relative image URLs to absolute URLs
  const transformedProjects = paginatedProjects.map((p: any) => 
    transformImagesToFullUrls(req, p, ['main_image'])
  );

  res.json({
    projects: transformedProjects,
    total_pages,
    current_page: page,
    total,
    limit
  });
}));

// GET featured projects
router.get("/featured", safe((req, res) => {
  const limit = parseInt(req.query.limit as string) || 0;
  const featuredProjects = db.prepare(`
    SELECT ${PROJECT_CARD_SELECT}
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    WHERE IFNULL(p.featured, p.is_featured) = 1
    ORDER BY p.id DESC
    ${limit > 0 ? 'LIMIT ?' : ''}
  `).all(...(limit > 0 ? [limit] : []));

  // Transform relative image URLs to absolute URLs
  const transformedProjects = (featuredProjects as any[]).map(p => 
    transformImagesToFullUrls(req, p, ['main_image'])
  );

  res.json({ projects: transformedProjects });
}));

// GET project amenities by project identifier
router.get("/:identifier/amenities", safe((req, res) => {
  const identifier = req.params.identifier;
  const project = resolveProject(identifier) as { id: number } | undefined;

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const amenities = db.prepare(`
    SELECT pa.amenity_id, a.name 
    FROM project_amenities pa
    JOIN amenities a ON pa.amenity_id = a.id
    WHERE pa.project_id = ?
  `).all(project.id) as any;

  res.json(Array.isArray(amenities) ? amenities : []);
}));

// GET project gallery by project identifier
router.get("/:identifier/gallery", safe((req, res) => {
  const identifier = req.params.identifier;
  const project = resolveProject(identifier) as { gallery?: string | string[]; main_image?: string } | undefined;

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  let gallery = [] as string[];
  try {
    const rawGallery = project.gallery;
    if (rawGallery) {
      gallery = typeof rawGallery === 'string' ? JSON.parse(rawGallery) : rawGallery;
    }
  } catch (err) {
    gallery = [];
  }

  const images = [project.main_image, ...(Array.isArray(gallery) ? gallery : [])].filter((img: any) => img);
  res.json(images);
}));

// GET single project by ID or slug
router.get("/:identifier", safe((req, res) => {
  const identifier = req.params.identifier;

  if (!identifier) {
    return res.status(404).json({ error: "Not found" });
  }

  let project;
  if (/^\d+$/.test(identifier)) {
    project = db.prepare(`
      SELECT p.*, d.name as developer_name, dest.name as destination_name, dest.slug as destination_slug 
      FROM projects p
      LEFT JOIN developers d ON p.developer_id = d.id
      LEFT JOIN destinations dest ON p.destination_id = dest.id
      WHERE p.id = ?
    `).get(parseInt(identifier));
  } else {
    project = db.prepare(`
      SELECT p.*, d.name as developer_name, dest.name as destination_name, dest.slug as destination_slug 
      FROM projects p
      LEFT JOIN developers d ON p.developer_id = d.id
      LEFT JOIN destinations dest ON p.destination_id = dest.id
      WHERE p.slug = ?
    `).get(identifier);
  }

  if (!project) return res.status(404).json({ error: "Not found" });
  
  // Transform images to full URLs
  project = transformImagesToFullUrls(req, project, ['main_image']);
  
  // Transform gallery if present
  if (project.gallery) {
    project.gallery = transformGalleryToFullUrls(req, project.gallery);
  }
  
  res.json(project);

}));


// CREATE project
router.post("/", authenticate, safe((req, res) => {
  const { name, location, price_range, type, status, description, gallery, amenities, developer_id, destination_id, is_featured, featured, beds, size, slug, meta_title, meta_description } = req.body;
  const featuredValue = featured !== undefined ? (featured ? 1 : 0) : (is_featured ? 1 : 0);

  const baseSlugCandidate = (slug && slug.trim()) || name;
  const baseSlug = generateSlug(baseSlugCandidate || `project-${Date.now()}`);
  const finalSlug = makeUniqueSlug(baseSlug);
  const finalMetaTitle = meta_title || `${name} - Luxury ${type} in ${location}`;
  const finalMetaDescription = meta_description || (description ? description.substring(0, 160) : `Discover ${name}, a premium ${type.toLowerCase()} property in ${location}.`);

  const result = db.prepare(`
    INSERT INTO projects (name, location, price_range, type, status, description, gallery, developer_id, destination_id, is_featured, featured, beds, size, main_image, slug, meta_title, meta_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, location, price_range, type, status, description, JSON.stringify(gallery), developer_id, destination_id, is_featured ? 1 : 0, featuredValue, beds, size, gallery?.[0] || null, finalSlug, finalMetaTitle, finalMetaDescription);

  const projectId = result.lastInsertRowid;

  // Insert amenities into project_amenities table
  if (amenities && Array.isArray(amenities) && amenities.length > 0) {
    const stmt = db.prepare("INSERT INTO project_amenities (project_id, amenity_id) VALUES (?, ?)");
    amenities.forEach(amenityId => {
      stmt.run(projectId, amenityId);
    });
  }

  res.json({ id: projectId, slug: finalSlug });
}));

// UPDATE project
router.put("/:id", authenticate, safe((req, res) => {
  const { name, location, price_range, type, status, description, gallery, amenities, developer_id, destination_id, is_featured, featured, beds, size, slug, meta_title, meta_description } = req.body;
  const projectId = parseInt(req.params.id);
  const featuredValue = featured !== undefined ? (featured ? 1 : 0) : (is_featured ? 1 : 0);

  const baseSlug = (slug && slug.trim()) || generateSlug(name);
  const finalSlug = makeUniqueSlug(generateSlug(baseSlug), projectId);
  const finalMetaTitle = meta_title || `${name} - Luxury ${type} in ${location}`;
  const finalMetaDescription = meta_description || description.substring(0, 160) || `Discover ${name}, a premium ${type.toLowerCase()} property in ${location}.`;

  db.prepare(`
    UPDATE projects SET name=?, location=?, price_range=?, type=?, status=?, description=?, gallery=?, developer_id=?, destination_id=?, is_featured=?, featured=?, beds=?, size=?, slug=?, meta_title=?, meta_description=?
    WHERE id=?
  `).run(
    name,
    location,
    price_range,
    type,
    status,
    description,
    JSON.stringify(gallery),
    developer_id,
    destination_id,
    is_featured ? 1 : 0,
    featuredValue,
    beds,
    size,
    finalSlug,
    finalMetaTitle,
    finalMetaDescription,
    projectId
  );

  // Delete old amenities and insert new ones
  db.prepare("DELETE FROM project_amenities WHERE project_id = ?").run(projectId);
  if (amenities && Array.isArray(amenities) && amenities.length > 0) {
    const stmt = db.prepare("INSERT INTO project_amenities (project_id, amenity_id) VALUES (?, ?)");
    amenities.forEach(amenityId => {
      stmt.run(projectId, amenityId);
    });
  }

  res.json({ success: true });
}));

// DUPLICATE project
router.post("/:id/duplicate", authenticate, safe((req, res) => {
  const sourceProjectId = parseInt(req.params.id);
  if (Number.isNaN(sourceProjectId)) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  const sourceProject = db.prepare("SELECT * FROM projects WHERE id = ?").get(sourceProjectId) as any;
  if (!sourceProject) {
    return res.status(404).json({ error: "Project not found" });
  }

  const copiedName = `${sourceProject.name} Copy`;
  const copiedSlug = makeUniqueSlug(generateSlug(copiedName || `project-${Date.now()}`));

  const result = db.prepare(`
    INSERT INTO projects (name, location, price_range, type, status, description, gallery, developer_id, destination_id, is_featured, featured, beds, size, main_image, slug, meta_title, meta_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    copiedName,
    sourceProject.location,
    sourceProject.price_range,
    sourceProject.type,
    sourceProject.status,
    sourceProject.description,
    sourceProject.gallery,
    sourceProject.developer_id,
    sourceProject.destination_id,
    sourceProject.is_featured ? 1 : 0,
    sourceProject.featured ? 1 : 0,
    sourceProject.beds,
    sourceProject.size,
    sourceProject.main_image,
    copiedSlug,
    sourceProject.meta_title,
    sourceProject.meta_description
  );

  const duplicatedProjectId = Number(result.lastInsertRowid);

  const sourceAmenities = db.prepare("SELECT amenity_id FROM project_amenities WHERE project_id = ?").all(sourceProjectId) as Array<{ amenity_id: number }>;
  if (sourceAmenities.length > 0) {
    const insertAmenity = db.prepare("INSERT INTO project_amenities (project_id, amenity_id) VALUES (?, ?)");
    sourceAmenities.forEach(({ amenity_id }) => {
      insertAmenity.run(duplicatedProjectId, amenity_id);
    });
  }

  res.json({ id: duplicatedProjectId });
}));

// DELETE project
router.delete("/:id", authenticate, safe((req, res) => {
  const projectId = parseInt(req.params.id);
  if (Number.isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  try {
    const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(projectId) as { id: number } | undefined;
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const hasProjectImagesTable = !!db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'project_images'")
      .get();

    const deleteProjectWithRelations = db.transaction((id: number) => {
      if (hasProjectImagesTable) {
        db.prepare("DELETE FROM project_images WHERE project_id = ?").run(id);
      }

      db.prepare("DELETE FROM project_amenities WHERE project_id = ?").run(id);
      db.prepare("DELETE FROM leads WHERE project_id = ?").run(id);
      db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    });

    deleteProjectWithRelations(projectId);
    res.json({ success: true, id: projectId });
  } catch (err: any) {
    console.error("Failed to delete project", err);
    res.status(500).json({ error: err?.message || "Failed to delete project" });
  }
}));

export default router;
