PRAGMA foreign_keys = ON;

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
  website TEXT,
  slug TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image TEXT,
  description TEXT,
  slug TEXT UNIQUE
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
  gallery TEXT,
  amenities TEXT,
  developer_id INTEGER,
  destination_id INTEGER,
  is_featured INTEGER DEFAULT 0,
  featured INTEGER DEFAULT 0,
  beds TEXT,
  size TEXT,
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT,
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  slug TEXT UNIQUE,
  meta_title TEXT,
  meta_description TEXT
);

CREATE TABLE IF NOT EXISTS careers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  location TEXT,
  type TEXT,
  description TEXT,
  requirements TEXT,
  apply_link TEXT
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_slug ON destinations(slug);
