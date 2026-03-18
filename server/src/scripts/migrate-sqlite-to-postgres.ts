/**
 * SQLite → PostgreSQL migration script
 *
 * Usage:
 *   SQLITE_PATH=./realestate.db npx tsx src/scripts/migrate-sqlite-to-postgres.ts
 *
 * SQLITE_PATH defaults to ./realestate.db relative to the server directory.
 * Set DRY_RUN=true to preview data without writing to PostgreSQL.
 */

import Database from "better-sqlite3";
import path from "path";
import { prisma } from "../lib/prisma.ts";

const SQLITE_PATH = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.resolve(process.cwd(), "realestate.db");

const DRY_RUN = process.env.DRY_RUN === "true";

// ── Helpers ─────────────────────────────────────────────────────────────────

function toDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
}

function rows<T = Record<string, unknown>>(db: InstanceType<typeof Database>, table: string): T[] {
  try {
    return db.prepare(`SELECT * FROM ${table}`).all() as T[];
  } catch {
    console.warn(`  ⚠  Table "${table}" not found in SQLite – skipping.`);
    return [];
  }
}

function log(msg: string) {
  console.log(msg);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // Validate SQLite file exists
  const { existsSync } = await import("fs");
  if (!existsSync(SQLITE_PATH)) {
    console.error(`\n✖  SQLite file not found: ${SQLITE_PATH}`);
    console.error(`   Set SQLITE_PATH env var to the correct path.\n`);
    process.exit(1);
  }

  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  log(`  SQLite → PostgreSQL migration`);
  log(`  Source : ${SQLITE_PATH}`);
  log(`  Mode   : ${DRY_RUN ? "DRY RUN (no writes)" : "LIVE"}`);
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  const db = new Database(SQLITE_PATH, { readonly: true });

  // ── Read all tables ───────────────────────────────────────────────────────
  const users            = rows(db, "users");
  const developers       = rows(db, "developers");
  const destinations     = rows(db, "destinations");
  const projects         = rows(db, "projects");
  const blogs            = rows(db, "blogs");
  const careers          = rows(db, "careers");
  const propertyTypes    = rows(db, "property_types");
  const amenities        = rows(db, "amenities");
  const projectAmenities = rows(db, "project_amenities");
  const leads            = rows(db, "leads");
  const newsletters      = rows(db, "newsletter_subscribers");

  log(`📦 Records found in SQLite:`);
  log(`   users              : ${users.length}`);
  log(`   developers         : ${developers.length}`);
  log(`   destinations       : ${destinations.length}`);
  log(`   projects           : ${projects.length}`);
  log(`   blogs              : ${blogs.length}`);
  log(`   careers            : ${careers.length}`);
  log(`   property_types     : ${propertyTypes.length}`);
  log(`   amenities          : ${amenities.length}`);
  log(`   project_amenities  : ${projectAmenities.length}`);
  log(`   leads              : ${leads.length}`);
  log(`   newsletter_subs    : ${newsletters.length}`);

  db.close();

  if (DRY_RUN) {
    log(`\n✔  Dry run complete. No data written.\n`);
    return;
  }

  // ── Write to PostgreSQL inside a transaction ──────────────────────────────
  log(`\n⏳ Writing to PostgreSQL…\n`);

  await prisma.$transaction(
    async (tx) => {

      // 1. Users
      if (users.length) {
        let count = 0;
        for (const u of users as any[]) {
          await tx.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
              id:       u.id,
              username: u.username,
              password: u.password,
              role:     u.role ?? "admin",
            },
          });
          count++;
        }
        log(`   ✔ users              : ${count} upserted`);
      }

      // 2. Developers
      if (developers.length) {
        let count = 0;
        for (const d of developers as any[]) {
          await tx.developer.upsert({
            where: { slug: d.slug },
            update: {
              name:        d.name,
              logo:        d.logo        ?? null,
              description: d.description ?? null,
              website:     d.website     ?? null,
            },
            create: {
              id:          d.id,
              name:        d.name,
              logo:        d.logo        ?? null,
              description: d.description ?? null,
              website:     d.website     ?? null,
              slug:        d.slug,
            },
          });
          count++;
        }
        log(`   ✔ developers         : ${count} upserted`);
      }

      // 3. Destinations
      if (destinations.length) {
        let count = 0;
        for (const d of destinations as any[]) {
          await tx.destination.upsert({
            where: { slug: d.slug },
            update: {
              name:        d.name,
              image:       d.image       ?? null,
              description: d.description ?? null,
            },
            create: {
              id:          d.id,
              name:        d.name,
              image:       d.image       ?? null,
              description: d.description ?? null,
              slug:        d.slug,
            },
          });
          count++;
        }
        log(`   ✔ destinations       : ${count} upserted`);
      }

      // 4. Projects
      if (projects.length) {
        let count = 0;
        for (const p of projects as any[]) {
          await tx.project.upsert({
            where: { slug: p.slug },
            update: {
              name:             p.name,
              location:         p.location         ?? null,
              price_range:      p.price_range       ?? null,
              type:             p.type              ?? null,
              status:           p.status            ?? null,
              description:      p.description       ?? null,
              main_image:       p.main_image        ?? null,
              gallery:          p.gallery           ?? null,
              amenities:        p.amenities         ?? null,
              developer_id:     p.developer_id      ?? null,
              destination_id:   p.destination_id    ?? null,
              is_featured:      p.is_featured       ?? 0,
              featured:         p.featured          ?? 0,
              beds:             p.beds              ?? null,
              size:             p.size              ?? null,
              meta_title:       p.meta_title        ?? null,
              meta_description: p.meta_description  ?? null,
            },
            create: {
              id:               p.id,
              name:             p.name,
              location:         p.location         ?? null,
              price_range:      p.price_range       ?? null,
              type:             p.type              ?? null,
              status:           p.status            ?? null,
              description:      p.description       ?? null,
              main_image:       p.main_image        ?? null,
              gallery:          p.gallery           ?? null,
              amenities:        p.amenities         ?? null,
              developer_id:     p.developer_id      ?? null,
              destination_id:   p.destination_id    ?? null,
              is_featured:      p.is_featured       ?? 0,
              featured:         p.featured          ?? 0,
              beds:             p.beds              ?? null,
              size:             p.size              ?? null,
              slug:             p.slug,
              meta_title:       p.meta_title        ?? null,
              meta_description: p.meta_description  ?? null,
            },
          });
          count++;
        }
        log(`   ✔ projects           : ${count} upserted`);
      }

      // 5. Blogs
      if (blogs.length) {
        let count = 0;
        for (const b of blogs as any[]) {
          await tx.blog.upsert({
            where: { slug: b.slug },
            update: {
              title:            b.title,
              content:          b.content          ?? null,
              image:            b.image            ?? null,
              category:         b.category         ?? null,
              author:           b.author           ?? null,
              created_at:       toDate(b.created_at) ?? new Date(),
              meta_title:       b.meta_title        ?? null,
              meta_description: b.meta_description  ?? null,
            },
            create: {
              id:               b.id,
              title:            b.title,
              content:          b.content          ?? null,
              image:            b.image            ?? null,
              category:         b.category         ?? null,
              author:           b.author           ?? null,
              created_at:       toDate(b.created_at) ?? new Date(),
              slug:             b.slug,
              meta_title:       b.meta_title        ?? null,
              meta_description: b.meta_description  ?? null,
            },
          });
          count++;
        }
        log(`   ✔ blogs              : ${count} upserted`);
      }

      // 6. Careers
      if (careers.length) {
        let count = 0;
        for (const c of careers as any[]) {
          const existing = await tx.career.findFirst({ where: { id: c.id } });
          if (!existing) {
            await tx.career.create({
              data: {
                id:           c.id,
                title:        c.title,
                location:     c.location     ?? null,
                type:         c.type         ?? null,
                description:  c.description  ?? null,
                requirements: c.requirements ?? null,
                apply_link:   c.apply_link   ?? null,
              },
            });
            count++;
          }
        }
        log(`   ✔ careers            : ${count} inserted`);
      }

      // 7. Property types
      if (propertyTypes.length) {
        let count = 0;
        for (const pt of propertyTypes as any[]) {
          await tx.propertyType.upsert({
            where: { name: pt.name },
            update: {},
            create: {
              id:         pt.id,
              name:       pt.name,
              created_at: toDate(pt.created_at) ?? new Date(),
            },
          });
          count++;
        }
        log(`   ✔ property_types     : ${count} upserted`);
      }

      // 8. Amenities
      if (amenities.length) {
        let count = 0;
        for (const a of amenities as any[]) {
          await tx.amenity.upsert({
            where: { name: a.name },
            update: {},
            create: {
              id:         a.id,
              name:       a.name,
              created_at: toDate(a.created_at) ?? new Date(),
            },
          });
          count++;
        }
        log(`   ✔ amenities          : ${count} upserted`);
      }

      // 9. Project ↔ Amenity join table
      if (projectAmenities.length) {
        let count = 0;
        for (const pa of projectAmenities as any[]) {
          // Only insert if both referenced records exist
          const [proj, amenity] = await Promise.all([
            tx.project.findUnique({ where: { id: pa.project_id } }),
            tx.amenity.findUnique({ where: { id: pa.amenity_id } }),
          ]);
          if (!proj || !amenity) continue;

          await tx.projectAmenity.upsert({
            where: {
              project_id_amenity_id: {
                project_id: pa.project_id,
                amenity_id: pa.amenity_id,
              },
            },
            update: {},
            create: {
              project_id: pa.project_id,
              amenity_id: pa.amenity_id,
            },
          });
          count++;
        }
        log(`   ✔ project_amenities  : ${count} upserted`);
      }

      // 10. Leads
      if (leads.length) {
        let count = 0;
        for (const l of leads as any[]) {
          const existing = await tx.lead.findFirst({ where: { id: l.id } });
          if (!existing) {
            await tx.lead.create({
              data: {
                id:         l.id,
                name:       l.name,
                email:      l.email,
                phone:      l.phone      ?? null,
                message:    l.message    ?? null,
                project_id: l.project_id ?? null,
                created_at: toDate(l.created_at) ?? new Date(),
              },
            });
            count++;
          }
        }
        log(`   ✔ leads              : ${count} inserted`);
      }

      // 11. Newsletter subscribers
      if (newsletters.length) {
        let count = 0;
        for (const n of newsletters as any[]) {
          await tx.newsletterSubscriber.upsert({
            where: { email: n.email },
            update: {},
            create: {
              id:         n.id,
              email:      n.email,
              created_at: toDate(n.created_at) ?? new Date(),
            },
          });
          count++;
        }
        log(`   ✔ newsletter_subs    : ${count} upserted`);
      }
    },
    { timeout: 60000 }
  );

  // Sync PostgreSQL sequences so future inserts don't collide with migrated IDs
  log(`\n⏳ Syncing auto-increment sequences…`);
  await prisma.$executeRawUnsafe(`
    SELECT setval(pg_get_serial_sequence('"users"',           'id'), COALESCE(MAX(id), 1)) FROM "users";
    SELECT setval(pg_get_serial_sequence('"developers"',      'id'), COALESCE(MAX(id), 1)) FROM "developers";
    SELECT setval(pg_get_serial_sequence('"destinations"',    'id'), COALESCE(MAX(id), 1)) FROM "destinations";
    SELECT setval(pg_get_serial_sequence('"projects"',        'id'), COALESCE(MAX(id), 1)) FROM "projects";
    SELECT setval(pg_get_serial_sequence('"blogs"',           'id'), COALESCE(MAX(id), 1)) FROM "blogs";
    SELECT setval(pg_get_serial_sequence('"careers"',         'id'), COALESCE(MAX(id), 1)) FROM "careers";
    SELECT setval(pg_get_serial_sequence('"property_types"',  'id'), COALESCE(MAX(id), 1)) FROM "property_types";
    SELECT setval(pg_get_serial_sequence('"amenities"',       'id'), COALESCE(MAX(id), 1)) FROM "amenities";
    SELECT setval(pg_get_serial_sequence('"leads"',           'id'), COALESCE(MAX(id), 1)) FROM "leads";
  `);
  log(`   ✔ Sequences synced`);

  log(`\n✅ Migration complete!\n`);
}

main()
  .catch((err) => {
    console.error("\n✖  Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
