import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { ensureDatabaseInitialized, getDatabasePath } from "./initDatabase.ts";

const DB_PATH = getDatabasePath();

// Create database file and schema on first run.
ensureDatabaseInitialized(DB_PATH);

export const db = new Database(DB_PATH);

type AddColumnTarget = "developers" | "projects" | "blogs" | "destinations";

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const addColumnIfMissing = (table: AddColumnTarget, col: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${col}`);
  } catch {
    // Ignore when the column already exists.
  }
};

const ensureSlugValues = (
  table: AddColumnTarget,
  idCol: string,
  titleCol: string,
  fallbackPrefix: string,
) => {
  const rows = db
    .prepare(`SELECT ${idCol} as id, ${titleCol} as title, slug FROM ${table}`)
    .all() as Array<{ id: number; title: string; slug?: string | null }>;

  for (const row of rows) {
    if (row.slug && row.slug.trim() !== "") continue;

    const baseSlug = slugify(row.title || "") || `${fallbackPrefix}-${row.id}`;
    let slug = baseSlug;
    let suffix = 1;

    while (
      db
        .prepare(`SELECT ${idCol} as id FROM ${table} WHERE slug = ? AND ${idCol} != ?`)
        .get(slug, row.id)
    ) {
      slug = `${baseSlug}-${suffix++}`;
    }

    db.prepare(`UPDATE ${table} SET slug = ? WHERE ${idCol} = ?`).run(slug, row.id);
  }
};

function runBackwardCompatibleMigrations() {
  addColumnIfMissing("developers", "slug TEXT");
  addColumnIfMissing("projects", "slug TEXT");
  addColumnIfMissing("projects", "meta_title TEXT");
  addColumnIfMissing("projects", "meta_description TEXT");
  addColumnIfMissing("projects", "featured INTEGER DEFAULT 0");
  addColumnIfMissing("blogs", "slug TEXT");
  addColumnIfMissing("blogs", "meta_title TEXT");
  addColumnIfMissing("blogs", "meta_description TEXT");
  addColumnIfMissing("destinations", "slug TEXT");

  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_developers_slug ON developers(slug)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug)");
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_slug ON destinations(slug)");

  ensureSlugValues("developers", "id", "name", "developer");
  ensureSlugValues("projects", "id", "name", "project");
  ensureSlugValues("blogs", "id", "title", "blog");
  ensureSlugValues("destinations", "id", "name", "destination");
}

function seedData() {
  const propertyTypeCount = db
    .prepare("SELECT COUNT(*) as count FROM property_types")
    .get() as { count: number };

  if (propertyTypeCount.count === 0) {
    const propertyTypes = ["Apartment", "Villa", "Penthouse", "Townhouse", "Studio", "Duplex"];
    for (const type of propertyTypes) {
      db.prepare("INSERT OR IGNORE INTO property_types (name) VALUES (?)").run(type);
    }
  }

  const amenityCount = db
    .prepare("SELECT COUNT(*) as count FROM amenities")
    .get() as { count: number };

  if (amenityCount.count === 0) {
    const amenities = ["Pool", "Gym", "Parking", "Security", "Garden", "Clubhouse", "Kids Area"];
    for (const amenity of amenities) {
      db.prepare("INSERT OR IGNORE INTO amenities (name) VALUES (?)").run(amenity);
    }
  }

  const adminExists = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");
  if (!adminExists) {
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
    if (initialPassword === "admin123") {
      process.stderr.write(
        "[WARN] Default admin password 'admin123' is in use. " +
        "Set ADMIN_INITIAL_PASSWORD env variable before first run, or change it via the admin panel.\n"
      );
    }
    const hashedPassword = bcrypt.hashSync(initialPassword, 10);
    db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run("admin", hashedPassword);
  }
}

export function initializeDatabase() {
  runBackwardCompatibleMigrations();
  seedData();
}
