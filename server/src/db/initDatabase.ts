import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..", "..");

function ensureColumnExists(db: Database.Database, tableName: string, columnName: string, columnDefinition: string) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{ name: string }>;
  const hasColumn = columns.some((column) => column.name === columnName);

  if (!hasColumn) {
    db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`);
  }
}

export function getDatabasePath() {
  return path.join(serverRoot, "realestate.db");
}

export function ensureDatabaseInitialized(dbPath = getDatabasePath()) {
  const dbAlreadyExists = fs.existsSync(dbPath);
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  const db = new Database(dbPath);

  try {
    const hasDevelopersTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'developers'")
      .get();

    if (!dbAlreadyExists || !hasDevelopersTable) {
      db.exec(schemaSql);
    }

    ensureColumnExists(db, "careers", "apply_link", "TEXT");

    // Newsletter subscribers table (added for production)
    db.exec(`
      CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } finally {
    db.close();
  }
}
