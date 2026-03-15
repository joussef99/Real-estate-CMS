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

// GET all projects with optional pagination
router.get("/", safe((req, res) => {
  const limit = parseInt(req.query.limit as string) || 1000; // Default to 1000 if not specified
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * limit;

  // Get total count
  const totalResult = db.prepare("SELECT COUNT(*) as count FROM projects").get() as any;
  const total = totalResult.count;
  const total_pages = Math.ceil(total / limit);

  // Validate page
  if (page < 1 || page > Math.max(total_pages, 1)) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  // Get paginated projects
  const projects = db.prepare(`
    SELECT p.*, d.name as developer_name, dest.name as destination_name 
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({
    projects,
    total_pages,
    current_page: page,
    total,
    limit
  });
}));

// SEARCH projects with advanced filters
router.get("/search", safe((req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 12;
  const offset = (page - 1) * limit;

  // Extract filters
  const destination_id = req.query.destination_id ? parseInt(req.query.destination_id as string) : null;
  const developer_id = req.query.developer_id ? parseInt(req.query.developer_id as string) : null;
  const property_type = req.query.property_type as string || null;
  const price_min = req.query.price_min ? parseFloat(req.query.price_min as string) : null;
  const price_max = req.query.price_max ? parseFloat(req.query.price_max as string) : null;
  const bedrooms = req.query.bedrooms as string || null;
  const amenities = req.query.amenities ? (req.query.amenities as string).split(',').map(a => parseInt(a)) : null;
  const search = (req.query.q as string || '').toLowerCase();

  // Build WHERE clause dynamically
  const whereConditions: string[] = [];
  const params: any[] = [];

  if (search) {
    whereConditions.push("(p.name LIKE ? OR p.location LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
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

  // Price range filter (approximate based on price range text)
  if (price_min || price_max) {
    // Note: price_range is stored as text like "EGP 5M - EGP 25M"
    // For more accurate filtering, we can add min_price and max_price columns
    // For now, we'll filter by the minimum value in the range
    if (price_min) {
      whereConditions.push("p.price_range LIKE ?");
      params.push(`%${price_min}%`);
    }
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // Get total count with filters
  const countQuery = `
    SELECT COUNT(DISTINCT p.id) as count 
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    ${whereClause}
  `;

  const countResult = db.prepare(countQuery).all(...params) as any;
  const total = countResult[0]?.count || 0;
  const total_pages = Math.ceil(total / limit);

  // Validate page
  if (page < 1 || (total > 0 && page > total_pages)) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  // Get paginated projects with filters
  let mainQuery = `
    SELECT DISTINCT p.*, d.name as developer_name, dest.name as destination_name 
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    ${whereClause}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, limit, offset];
  const projects = db.prepare(mainQuery).all(...queryParams);

  // If amenities filter is provided, fetch and filter separately
  let filteredProjects = projects;
  if (amenities && amenities.length > 0) {
    filteredProjects = (projects as any).filter(project => {
      const projectAmenities = db.prepare(`
        SELECT amenity_id FROM project_amenities WHERE project_id = ?
      `).all(project.id) as any;
      
      const projectAmenityIds = projectAmenities.map(pa => pa.amenity_id);
      return amenities.every(amenity_id => projectAmenityIds.includes(amenity_id));
    });
  }

  res.json({
    projects: filteredProjects,
    total_pages,
    current_page: page,
    total,
    limit
  });
}));

// GET single project by ID
router.get("/:id", safe((req, res) => {
  const identifier = req.params.id;

  if (!identifier || !/^\d+$/.test(identifier)) {
    return res.status(404).json({ error: "Not found" });
  }

  const project = db.prepare(`
    SELECT p.*, d.name as developer_name, dest.name as destination_name 
    FROM projects p
    LEFT JOIN developers d ON p.developer_id = d.id
    LEFT JOIN destinations dest ON p.destination_id = dest.id
    WHERE p.id = ?
  `).get(parseInt(identifier));

  if (!project) return res.status(404).json({ error: "Not found" });
  res.json(project);

}));

// GET project amenities by project ID
router.get("/:id/amenities", safe((req, res) => {
  const id = req.params.id;

  if (!/^\d+$/.test(id)) {
    return res.status(404).json({ error: "Not found" });
  }

  const amenities = db.prepare(`
    SELECT pa.amenity_id, a.name 
    FROM project_amenities pa
    JOIN amenities a ON pa.amenity_id = a.id
    WHERE pa.project_id = ?
  `).all(parseInt(id)) as any;

  res.json(amenities);
}));


// CREATE project
router.post("/", authenticate, safe((req, res) => {
  const { name, location, price_range, type, status, description, gallery, amenities, developer_id, destination_id, is_featured, beds, size, meta_title, meta_description } = req.body;
  
  const finalMetaTitle = meta_title || `${name} - Luxury ${type} in ${location}`;
  const finalMetaDescription = meta_description || description.substring(0, 160) || `Discover ${name}, a premium ${type.toLowerCase()} property in ${location}.`;
  
  const result = db.prepare(`
    INSERT INTO projects (name, location, price_range, type, status, description, gallery, developer_id, destination_id, is_featured, beds, size, main_image, meta_title, meta_description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, location, price_range, type, status, description, JSON.stringify(gallery), developer_id, destination_id, is_featured ? 1 : 0, beds, size, gallery?.[0] || null, finalMetaTitle, finalMetaDescription);
  
  const projectId = result.lastInsertRowid;
  
  // Insert amenities into project_amenities table
  if (amenities && Array.isArray(amenities) && amenities.length > 0) {
    const stmt = db.prepare("INSERT INTO project_amenities (project_id, amenity_id) VALUES (?, ?)");
    amenities.forEach(amenityId => {
      stmt.run(projectId, amenityId);
    });
  }
  
  res.json({ id: projectId });
}));

// UPDATE project
router.put("/:id", authenticate, safe((req, res) => {
  const { name, location, price_range, type, status, description, gallery, amenities, developer_id, destination_id, is_featured, beds, size, meta_title, meta_description } = req.body;
  const projectId = req.params.id;

  const finalMetaTitle = meta_title || `${name} - Luxury ${type} in ${location}`;
  const finalMetaDescription = meta_description || description.substring(0, 160) || `Discover ${name}, a premium ${type.toLowerCase()} property in ${location}.`;

  db.prepare(`
    UPDATE projects SET name=?, location=?, price_range=?, type=?, status=?, description=?, gallery=?, developer_id=?, destination_id=?, is_featured=?, beds=?, size=?, meta_title=?, meta_description=?
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
    beds,
    size,
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

// DELETE project
router.delete("/:id", authenticate, safe((req, res) => {
  db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
  res.json({ success: true });
}));

export default router;
