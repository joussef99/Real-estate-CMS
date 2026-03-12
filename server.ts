import express from "express";
import { createServer as createViteServer } from "vite";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
const developerUploadsDir = path.join(uploadsDir, 'developers');
const destinationUploadsDir = path.join(uploadsDir, 'destinations');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(developerUploadsDir)) {
  fs.mkdirSync(developerUploadsDir, { recursive: true });
}
if (!fs.existsSync(destinationUploadsDir)) {
  fs.mkdirSync(destinationUploadsDir, { recursive: true });
}

// Multer configuration for projects
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

// Multer configuration for developers
const developerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, developerUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

// Multer configuration for destinations
const destinationStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, destinationUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadDeveloper = multer({
  storage: developerStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadDestination = multer({
  storage: destinationStorage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const db = new Database("realestate.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-change-me";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'admin'
  );

  CREATE TABLE IF NOT EXISTS developers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT,
    description TEXT,
    website TEXT
  );

  CREATE TABLE IF NOT EXISTS destinations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    image TEXT,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT,
    price_range TEXT,
    type TEXT,
    status TEXT,
    description TEXT,
    main_image TEXT,
    gallery TEXT, -- JSON array
    amenities TEXT, -- JSON array
    developer_id INTEGER,
    destination_id INTEGER,
    is_featured INTEGER DEFAULT 0,
    beds TEXT,
    size TEXT,
    FOREIGN KEY (developer_id) REFERENCES developers(id),
    FOREIGN KEY (destination_id) REFERENCES destinations(id)
  );

  CREATE TABLE IF NOT EXISTS blogs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    image TEXT,
    category TEXT,
    author TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS careers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    location TEXT,
    type TEXT,
    description TEXT,
    requirements TEXT
  );

  CREATE TABLE IF NOT EXISTS property_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT,
    project_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );

  CREATE TABLE IF NOT EXISTS amenities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_amenities (
    project_id INTEGER,
    amenity_id INTEGER,
    PRIMARY KEY (project_id, amenity_id),
    FOREIGN KEY (project_id) REFERENCES projects(id),
    FOREIGN KEY (amenity_id) REFERENCES amenities(id)
  );
`);

// Seed property types if empty
const propertyTypeCount = db.prepare("SELECT COUNT(*) as count FROM property_types").get().count;
if (propertyTypeCount === 0) {
  const propertyTypes = ['Apartment', 'Villa', 'Penthouse', 'Townhouse', 'Studio', 'Duplex'];
  propertyTypes.forEach(type => {
    db.prepare("INSERT OR IGNORE INTO property_types (name) VALUES (?)").run(type);
  });
}

// Seed amenities if empty
const amenityCount = db.prepare("SELECT COUNT(*) as count FROM amenities").get().count;
if (amenityCount === 0) {
  const amenities = ['Pool', 'Gym', 'Parking', 'Security', 'Garden', 'Clubhouse', 'Kids Area'];
  amenities.forEach(amenity => {
    db.prepare("INSERT OR IGNORE INTO amenities (name) VALUES (?)").run(amenity);
  });
}

// Seed admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
}

// Seed initial data if empty
const projectCount = db.prepare("SELECT COUNT(*) as count FROM projects").get().count;
if (projectCount === 0) {
  const developers = [
    {
      name: "Mountain View",
      logo: "https://mountainviewegypt.com/wp-content/uploads/2021/06/Mountain-View-Logo.png",
      description: "Mountain View is a leading Egyptian real estate developer known for its unique architectural styles and vibrant communities."
    },
    {
      name: "SODIC",
      logo: "https://sodic.com/wp-content/themes/sodic/assets/images/logo.png",
      description: "SODIC is one of Egypt's leading real estate development companies, with a track record of delivering high-quality projects."
    },
    {
      name: "Palm Hills",
      logo: "https://www.palmhillsdevelopments.com/assets/images/logo.png",
      description: "Palm Hills Developments is a leading real estate company in the Egyptian market, primarily developing integrated residential, commercial real estate and resort projects."
    },
    {
      name: "Emaar Misr",
      logo: "https://emaarmisr.com/wp-content/uploads/2021/05/emaar-misr-logo.png",
      description: "Emaar Misr is the Egyptian arm of the global developer Emaar, bringing world-class standards to Egypt's most prestigious locations."
    }
  ];

  const devIds = developers.map(dev => 
    db.prepare("INSERT INTO developers (name, logo, description) VALUES (?, ?, ?)").run(dev.name, dev.logo, dev.description).lastInsertRowid
  );

  const destinations = [
    {
      name: "New Capital",
      image: "https://images.unsplash.com/photo-1541339907198-e08756edd811?auto=format&fit=crop&q=80&w=800",
      description: "The New Administrative Capital is Egypt's future hub, featuring modern infrastructure, smart city features, and the iconic Iconic Tower."
    },
    {
      name: "North Coast",
      image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800",
      description: "Egypt's Mediterranean paradise, known for its crystal-clear waters, white sandy beaches, and luxury summer resorts."
    },
    {
      name: "El Gouna",
      image: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800",
      description: "A self-sufficient, fully integrated resort town on the Red Sea coast, offering a unique lifestyle and world-class amenities."
    },
    {
      name: "New Cairo",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=800",
      description: "A prestigious residential and commercial district in Eastern Cairo, home to the American University in Cairo and luxury compounds."
    },
    {
      name: "Sheikh Zayed",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
      description: "A high-end residential city in Western Cairo, known for its green spaces, luxury malls, and quiet atmosphere."
    },
    {
      name: "Soma Bay",
      image: "https://images.unsplash.com/photo-1506929197327-fb87b5d5ba05?auto=format&fit=crop&q=80&w=800",
      description: "An exclusive Red Sea destination featuring luxury hotels, golf courses, and world-renowned diving spots."
    }
  ];

  const destIds = destinations.map(dest => 
    db.prepare("INSERT INTO destinations (name, image, description) VALUES (?, ?, ?)").run(dest.name, dest.image, dest.description).lastInsertRowid
  );

  const projects = [
    {
      name: "Mountain View iCity",
      location: "New Cairo",
      price_range: "EGP 5M - EGP 25M",
      type: "Apartment",
      status: "Under Construction",
      description: "iCity is a revolutionary concept in New Cairo, offering a unique living experience with its 4D design and extensive green spaces.",
      main_image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
      gallery: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=800"
      ],
      amenities: ["Central Park", "Clubhouse", "Smart Home", "Security"],
      developer_id: devIds[0],
      destination_id: destIds[3],
      is_featured: 1,
      beds: "1-4 Beds",
      size: "100 - 450 sqm"
    },
    {
      name: "Marassi",
      location: "North Coast",
      price_range: "EGP 15M - EGP 150M",
      type: "Villa",
      status: "Completed",
      description: "Marassi is the North Coast's premier destination, offering a Mediterranean lifestyle with world-class golf courses and a vibrant marina.",
      main_image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
      gallery: [
        "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&q=80&w=800"
      ],
      amenities: ["Beach Access", "Marina", "Golf Course", "Luxury Spa"],
      developer_id: devIds[3],
      destination_id: destIds[1],
      is_featured: 1,
      beds: "3-6 Beds",
      size: "250 - 1,200 sqm"
    },
    {
      name: "SODIC East",
      location: "New Capital",
      price_range: "EGP 8M - EGP 40M",
      type: "Townhouse",
      status: "Off-Plan",
      description: "SODIC East is a modern integrated community in the New Capital, designed for those who seek a balanced and healthy lifestyle.",
      main_image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=800",
      gallery: [
        "https://images.unsplash.com/photo-1503387762-592dee58c460?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800"
      ],
      amenities: ["Sports Club", "Retail Area", "Parks", "Schools"],
      developer_id: devIds[1],
      destination_id: destIds[0],
      is_featured: 0,
      beds: "2-5 Beds",
      size: "180 - 600 sqm"
    }
  ];

  projects.forEach(p => {
    db.prepare(`
      INSERT INTO projects (name, location, price_range, type, status, description, main_image, gallery, amenities, developer_id, destination_id, is_featured, beds, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      p.name, p.location, p.price_range, p.type, p.status, p.description, p.main_image, 
      JSON.stringify(p.gallery), JSON.stringify(p.amenities), p.developer_id, p.destination_id, p.is_featured, p.beds, p.size
    );
  });

  db.prepare("INSERT INTO blogs (title, content, image, category, author) VALUES (?, ?, ?, ?, ?)").run(
    "Investing in the New Administrative Capital",
    "The New Capital is set to become the heart of Egypt's economy, making it a prime spot for real estate investment...",
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800",
    "Investment",
    "Ahmed Mansour"
  );

  db.prepare("INSERT INTO careers (title, location, type, description, requirements) VALUES (?, ?, ?, ?, ?)").run(
    "Luxury Property Consultant",
    "New Cairo, Egypt",
    "Full-time",
    "Join our elite sales team and help clients find their dream homes in Egypt's most prestigious compounds.",
    "3+ years experience in the Egyptian real estate market, fluent in English and Arabic."
  );
}

async function startServer() {
  const app = express();
  app.use(express.json());
  
  // Serve uploaded images
  app.use("/uploads", express.static(uploadsDir));

  // Upload endpoint for projects
  app.post("/api/upload", upload.array('images', 10), (req, res) => {
    if (!(req as any).files || (req as any).files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    
    const uploadedPaths = (req as any).files.map((file: any) => `/uploads/${file.filename}`);
    res.json({ images: uploadedPaths });
  });

  // Upload endpoint for developer logo
  app.post("/api/upload/developer-logo", uploadDeveloper.single('logo'), (req, res) => {
    if (!(req as any).file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const logoPath = `/uploads/developers/${(req as any).file.filename}`;
    res.json({ logo: logoPath });
  });

  // Upload endpoint for destination image
  app.post("/api/upload/destination-image", uploadDestination.single('image'), (req, res) => {
    if (!(req as any).file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const imagePath = `/uploads/destinations/${(req as any).file.filename}`;
    res.json({ image: imagePath });
  });

  // Error handling for multer
  app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum 5MB allowed.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ error: 'Too many files. Maximum 10 files allowed.' });
      }
    } else if (err.message === 'Only image files are allowed') {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }
    next(err);
  });

  // Auth Middleware
  const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      req.user = jwt.verify(token, JWT_SECRET);
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username } });
  });

  // Public API Routes
  app.get("/api/projects", (req, res) => {
    const projects = db.prepare(`
      SELECT p.*, d.name as developer_name, dest.name as destination_name 
      FROM projects p
      LEFT JOIN developers d ON p.developer_id = d.id
      LEFT JOIN destinations dest ON p.destination_id = dest.id
    `).all();
    res.json(projects);
  });

  app.get("/api/projects/:id", (req, res) => {
    const project = db.prepare(`
      SELECT p.*, d.name as developer_name, dest.name as destination_name 
      FROM projects p
      LEFT JOIN developers d ON p.developer_id = d.id
      LEFT JOIN destinations dest ON p.destination_id = dest.id
      WHERE p.id = ?
    `).get(req.params.id);
    if (!project) return res.status(404).json({ error: "Not found" });
    res.json(project);
  });

  app.get("/api/developers", (req, res) => {
    const developers = db.prepare("SELECT * FROM developers").all();
    res.json(developers);
  });

  app.get("/api/destinations", (req, res) => {
    const destinations = db.prepare(`
      SELECT d.*, (SELECT COUNT(*) FROM projects p WHERE p.destination_id = d.id) as project_count
      FROM destinations d
    `).all();
    res.json(destinations);
  });

  app.get("/api/property-types", (req, res) => {
    const propertyTypes = db.prepare("SELECT * FROM property_types ORDER BY name").all();
    res.json(propertyTypes);
  });

  app.get("/api/amenities", (req, res) => {
    const amenities = db.prepare("SELECT * FROM amenities ORDER BY name").all();
    res.json(amenities);
  });

  app.get("/api/projects/:id/amenities", (req, res) => {
    const amenities = db.prepare(`
      SELECT pa.amenity_id, a.name 
      FROM project_amenities pa
      JOIN amenities a ON pa.amenity_id = a.id
      WHERE pa.project_id = ?
    `).all(req.params.id);
    res.json(amenities);
  });

  app.get("/api/blogs", (req, res) => {
    const blogs = db.prepare("SELECT * FROM blogs ORDER BY created_at DESC").all();
    res.json(blogs);
  });

  app.get("/api/careers", (req, res) => {
    const careers = db.prepare("SELECT * FROM careers").all();
    res.json(careers);
  });

  // Leads endpoint (public)
  app.post("/api/leads", (req, res) => {
    const { name, email, phone, message, project_id } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }
    
    const result = db.prepare("INSERT INTO leads (name, email, phone, message, project_id) VALUES (?, ?, ?, ?, ?)")
      .run(name, email, phone || null, message, project_id || null);
    res.json({ id: result.lastInsertRowid });
  });

  // Admin Protected Routes
  app.post("/api/admin/projects", authenticate, (req, res) => {
    const { name, location, price_range, type, status, description, gallery, amenities, developer_id, destination_id, is_featured, beds, size } = req.body;
    const result = db.prepare(`
      INSERT INTO projects (name, location, price_range, type, status, description, gallery, developer_id, destination_id, is_featured, beds, size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, location, price_range, type, status, description, JSON.stringify(gallery), developer_id, destination_id, is_featured ? 1 : 0, beds, size);
    
    const projectId = result.lastInsertRowid;
    
    // Insert amenities into project_amenities table
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      const stmt = db.prepare("INSERT INTO project_amenities (project_id, amenity_id) VALUES (?, ?)");
      amenities.forEach(amenityId => {
        stmt.run(projectId, amenityId);
      });
    }
    
    res.json({ id: projectId });
  });

  app.put("/api/admin/projects/:id", authenticate, (req, res) => {
    const { name, location, price_range, type, status, description, gallery, amenities, developer_id, destination_id, is_featured, beds, size } = req.body;
    const projectId = req.params.id;
    
    db.prepare(`
      UPDATE projects SET name=?, location=?, price_range=?, type=?, status=?, description=?, gallery=?, developer_id=?, destination_id=?, is_featured=?, beds=?, size=?
      WHERE id=?
    `).run(name, location, price_range, type, status, description, JSON.stringify(gallery), developer_id, destination_id, is_featured ? 1 : 0, beds, size, projectId);
    
    // Delete old amenities and insert new ones
    db.prepare("DELETE FROM project_amenities WHERE project_id = ?").run(projectId);
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      const stmt = db.prepare("INSERT INTO project_amenities (project_id, amenity_id) VALUES (?, ?)");
      amenities.forEach(amenityId => {
        stmt.run(projectId, amenityId);
      });
    }
    
    res.json({ success: true });
  });

  app.delete("/api/admin/projects/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM projects WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Similar routes for developers, destinations, blogs, careers...
  app.post("/api/admin/developers", authenticate, (req, res) => {
    const { name, logo, description } = req.body;
    const result = db.prepare("INSERT INTO developers (name, logo, description) VALUES (?, ?, ?)").run(name, logo, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/developers/:id", authenticate, (req, res) => {
    const { name, logo, description } = req.body;
    db.prepare("UPDATE developers SET name=?, logo=?, description=? WHERE id=?").run(name, logo, description, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/developers/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM developers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/destinations", authenticate, (req, res) => {
    const { name, image, description } = req.body;
    const result = db.prepare("INSERT INTO destinations (name, image, description) VALUES (?, ?, ?)").run(name, image, description);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/destinations/:id", authenticate, (req, res) => {
    const { name, image, description } = req.body;
    db.prepare("UPDATE destinations SET name=?, image=?, description=? WHERE id=?").run(name, image, description, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/destinations/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM destinations WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/blogs", authenticate, (req, res) => {
    const { title, content, image, category, author } = req.body;
    const result = db.prepare("INSERT INTO blogs (title, content, image, category, author) VALUES (?, ?, ?, ?, ?)").run(title, content, image, category, author);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/blogs/:id", authenticate, (req, res) => {
    const { title, content, image, category, author } = req.body;
    db.prepare("UPDATE blogs SET title=?, content=?, image=?, category=?, author=? WHERE id=?").run(title, content, image, category, author, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/blogs/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM blogs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/admin/careers", authenticate, (req, res) => {
    const { title, location, type, description, requirements } = req.body;
    const result = db.prepare("INSERT INTO careers (title, location, type, description, requirements) VALUES (?, ?, ?, ?, ?)").run(title, location, type, description, requirements);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/careers/:id", authenticate, (req, res) => {
    const { title, location, type, description, requirements } = req.body;
    db.prepare("UPDATE careers SET title=?, location=?, type=?, description=?, requirements=? WHERE id=?").run(title, location, type, description, requirements, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/careers/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM careers WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Property Types CRUD
  app.post("/api/admin/property-types", authenticate, (req, res) => {
    const { name } = req.body;
    const result = db.prepare("INSERT INTO property_types (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/property-types/:id", authenticate, (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE property_types SET name=? WHERE id=?").run(name, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/property-types/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM property_types WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Amenities CRUD
  app.post("/api/admin/amenities", authenticate, (req, res) => {
    const { name } = req.body;
    const result = db.prepare("INSERT INTO amenities (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid });
  });

  app.put("/api/admin/amenities/:id", authenticate, (req, res) => {
    const { name } = req.body;
    db.prepare("UPDATE amenities SET name=? WHERE id=?").run(name, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/admin/amenities/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM amenities WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Leads CRUD
  app.get("/api/admin/leads", authenticate, (req, res) => {
    const leads = db.prepare("SELECT l.*, p.name as project_name FROM leads l LEFT JOIN projects p ON l.project_id = p.id ORDER BY l.created_at DESC").all();
    res.json(leads);
  });

  app.delete("/api/admin/leads/:id", authenticate, (req, res) => {
    db.prepare("DELETE FROM leads WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Stats
  app.get("/api/admin/stats", authenticate, (req, res) => {
    const stats = {
      projects: db.prepare("SELECT COUNT(*) as count FROM projects").get().count,
      developers: db.prepare("SELECT COUNT(*) as count FROM developers").get().count,
      destinations: db.prepare("SELECT COUNT(*) as count FROM destinations").get().count,
      blogs: db.prepare("SELECT COUNT(*) as count FROM blogs").get().count,
    };
    res.json(stats);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on http://localhost:3000");
  });
}

startServer();
