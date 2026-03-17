import fs from "fs";
import path from "path";
import Database from "better-sqlite3";

export function getDatabasePath() {
  return path.join(process.cwd(), "realestate.db");
}

export function ensureDatabaseInitialized(dbPath = getDatabasePath()) {
  const dbAlreadyExists = fs.existsSync(dbPath);
  const schemaPath = path.join(process.cwd(), "server", "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");

  const db = new Database(dbPath);

  try {
    const hasDevelopersTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'developers'")
      .get();

    if (!dbAlreadyExists || !hasDevelopersTable) {
      db.exec(schemaSql);
    }
  } finally {
    db.close();
  }
}
