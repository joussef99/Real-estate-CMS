/**
 * SQLite → PostgreSQL migration script
 *
 * Usage:
 *   SQLITE_PATH=./realestate.db npx tsx src/scripts/migrate-sqlite-to-postgres.ts
 *
 * SQLITE_PATH defaults to ./realestate.db relative to the server directory.
 * Set DRY_RUN=true to preview data without writing to PostgreSQL.
 */

import "dotenv/config";
import Database from "better-sqlite3";
import { Prisma } from "@prisma/client";
import path from "path";
import { logDatabaseConnection, prisma } from "../lib/prisma.ts";

const SQLITE_PATH = process.env.SQLITE_PATH
  ? path.resolve(process.env.SQLITE_PATH)
  : path.resolve(process.cwd(), "realestate.db");

const DRY_RUN = process.env.DRY_RUN === "true";

type SqliteRow = Record<string, any>;

type MigrationStats = {
  processed: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
};

type IdMap = Map<number, number>;

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

function makeStats(): MigrationStats {
  return {
    processed: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
  };
}

function shouldLogProgress(processed: number, total: number): boolean {
  if (total <= 10) return true;
  if (processed === total) return true;
  return processed % 25 === 0;
}

function logSection(label: string, total: number) {
  log(`\n▶ ${label} (${total} rows)`);
}

function logProgress(label: string, processed: number, total: number, stats: MigrationStats) {
  if (!shouldLogProgress(processed, total)) return;
  log(
    `   … ${label}: ${processed}/${total} processed ` +
      `(created=${stats.created}, updated=${stats.updated}, skipped=${stats.skipped}, failed=${stats.failed})`,
  );
}

function logSummary(label: string, stats: MigrationStats) {
  log(
    `   ✔ ${label.padEnd(18)} processed=${stats.processed} created=${stats.created} ` +
      `updated=${stats.updated} skipped=${stats.skipped} failed=${stats.failed}`,
  );
}

function isPrismaDuplicateError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function relationId(
  map: IdMap,
  originalId: number | null | undefined,
  relationLabel: string,
  ownerLabel: string,
  ownerId: number,
): number | null {
  if (originalId == null) return null;

  const mappedId = map.get(originalId);
  if (mappedId == null) {
    log(`   ⚠ relation skipped: ${ownerLabel}#${ownerId} -> missing ${relationLabel}#${originalId}`);
    return null;
  }

  return mappedId;
}

async function syncSequences() {
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
    SELECT setval(pg_get_serial_sequence('"newsletter_subscribers"', 'id'), COALESCE(MAX(id), 1)) FROM "newsletter_subscribers";
  `);
  log(`   ✔ Sequences synced`);
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

  logDatabaseConnection("sqlite-to-postgres-migration");

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

  // ── Write to PostgreSQL with idempotent upserts ──────────────────────────
  log(`\n⏳ Writing to PostgreSQL…\n`);

  const tx = prisma;
  const developerIdMap = new Map<number, number>();
  const destinationIdMap = new Map<number, number>();
  const projectIdMap = new Map<number, number>();
  const amenityIdMap = new Map<number, number>();

  const overall = new Map<string, MigrationStats>();

  if (users.length) {
    const stats = makeStats();
    logSection("users", users.length);
    for (const [index, user] of (users as SqliteRow[]).entries()) {
      try {
        const existing = await tx.user.findUnique({ where: { username: user.username } });
        await tx.user.upsert({
          where: { username: user.username },
          update: {
            password: user.password,
            role: user.role ?? "admin",
          },
          create: {
            username: user.username,
            password: user.password,
            role: user.role ?? "admin",
          },
        });
        stats.processed++;
        if (existing) stats.updated++;
        else stats.created++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ users: duplicate username skipped (${user.username})`);
        } else {
          throw error;
        }
      }
      logProgress("users", index + 1, users.length, stats);
    }
    overall.set("users", stats);
    logSummary("users", stats);
  }

  if (developers.length) {
    const stats = makeStats();
    logSection("developers", developers.length);
    for (const [index, developer] of (developers as SqliteRow[]).entries()) {
      const existing = await tx.developer.findFirst({
        where: { OR: [{ id: developer.id }, { slug: developer.slug }] },
      });

      try {
        if (existing) {
          const updated = await tx.developer.update({
            where: { id: existing.id },
            data: {
              name: developer.name,
              logo: developer.logo ?? null,
              description: developer.description ?? null,
              website: developer.website ?? null,
              slug: developer.slug,
            },
          });
          developerIdMap.set(developer.id, updated.id);
          stats.updated++;
        } else {
          const created = await tx.developer.create({
            data: {
              id: developer.id,
              name: developer.name,
              logo: developer.logo ?? null,
              description: developer.description ?? null,
              website: developer.website ?? null,
              slug: developer.slug,
            },
          });
          developerIdMap.set(developer.id, created.id);
          stats.created++;
        }
        stats.processed++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ developers: duplicate row skipped (id=${developer.id}, slug=${developer.slug})`);
        } else {
          throw error;
        }
      }
      logProgress("developers", index + 1, developers.length, stats);
    }
    overall.set("developers", stats);
    logSummary("developers", stats);
  }

  if (destinations.length) {
    const stats = makeStats();
    logSection("destinations", destinations.length);
    for (const [index, destination] of (destinations as SqliteRow[]).entries()) {
      const existing = await tx.destination.findFirst({
        where: { OR: [{ id: destination.id }, { slug: destination.slug }] },
      });

      try {
        if (existing) {
          const updated = await tx.destination.update({
            where: { id: existing.id },
            data: {
              name: destination.name,
              image: destination.image ?? null,
              description: destination.description ?? null,
              slug: destination.slug,
            },
          });
          destinationIdMap.set(destination.id, updated.id);
          stats.updated++;
        } else {
          const created = await tx.destination.create({
            data: {
              id: destination.id,
              name: destination.name,
              image: destination.image ?? null,
              description: destination.description ?? null,
              slug: destination.slug,
            },
          });
          destinationIdMap.set(destination.id, created.id);
          stats.created++;
        }
        stats.processed++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ destinations: duplicate row skipped (id=${destination.id}, slug=${destination.slug})`);
        } else {
          throw error;
        }
      }
      logProgress("destinations", index + 1, destinations.length, stats);
    }
    overall.set("destinations", stats);
    logSummary("destinations", stats);
  }

  if (projects.length) {
    const stats = makeStats();
    logSection("projects", projects.length);
    for (const [index, project] of (projects as SqliteRow[]).entries()) {
      const mappedDeveloperId = relationId(
        developerIdMap,
        project.developer_id,
        "developer",
        "project",
        project.id,
      );
      const mappedDestinationId = relationId(
        destinationIdMap,
        project.destination_id,
        "destination",
        "project",
        project.id,
      );
      const existing = await tx.project.findFirst({
        where: { OR: [{ id: project.id }, { slug: project.slug }] },
      });

      try {
        if (existing) {
          const updated = await tx.project.update({
            where: { id: existing.id },
            data: {
              name: project.name,
              location: project.location ?? null,
              price_range: project.price_range ?? null,
              type: project.type ?? null,
              status: project.status ?? null,
              description: project.description ?? null,
              main_image: project.main_image ?? null,
              gallery: project.gallery ?? null,
              amenities: project.amenities ?? null,
              developer_id: mappedDeveloperId,
              destination_id: mappedDestinationId,
              is_featured: project.is_featured ?? 0,
              featured: project.featured ?? 0,
              beds: project.beds ?? null,
              size: project.size ?? null,
              slug: project.slug,
              meta_title: project.meta_title ?? null,
              meta_description: project.meta_description ?? null,
            },
          });
          projectIdMap.set(project.id, updated.id);
          stats.updated++;
        } else {
          const created = await tx.project.create({
            data: {
              id: project.id,
              name: project.name,
              location: project.location ?? null,
              price_range: project.price_range ?? null,
              type: project.type ?? null,
              status: project.status ?? null,
              description: project.description ?? null,
              main_image: project.main_image ?? null,
              gallery: project.gallery ?? null,
              amenities: project.amenities ?? null,
              developer_id: mappedDeveloperId,
              destination_id: mappedDestinationId,
              is_featured: project.is_featured ?? 0,
              featured: project.featured ?? 0,
              beds: project.beds ?? null,
              size: project.size ?? null,
              slug: project.slug,
              meta_title: project.meta_title ?? null,
              meta_description: project.meta_description ?? null,
            },
          });
          projectIdMap.set(project.id, created.id);
          stats.created++;
        }
        stats.processed++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ projects: duplicate row skipped (id=${project.id}, slug=${project.slug})`);
        } else {
          throw error;
        }
      }
      logProgress("projects", index + 1, projects.length, stats);
    }
    overall.set("projects", stats);
    logSummary("projects", stats);
  }

  if (blogs.length) {
    const stats = makeStats();
    logSection("blogs", blogs.length);
    for (const [index, blog] of (blogs as SqliteRow[]).entries()) {
      const existing = await tx.blog.findFirst({ where: { OR: [{ id: blog.id }, { slug: blog.slug }] } });

      try {
        if (existing) {
          await tx.blog.update({
            where: { id: existing.id },
            data: {
              title: blog.title,
              content: blog.content ?? null,
              image: blog.image ?? null,
              category: blog.category ?? null,
              author: blog.author ?? null,
              created_at: toDate(blog.created_at) ?? new Date(),
              slug: blog.slug,
              meta_title: blog.meta_title ?? null,
              meta_description: blog.meta_description ?? null,
            },
          });
          stats.updated++;
        } else {
          await tx.blog.create({
            data: {
              id: blog.id,
              title: blog.title,
              content: blog.content ?? null,
              image: blog.image ?? null,
              category: blog.category ?? null,
              author: blog.author ?? null,
              created_at: toDate(blog.created_at) ?? new Date(),
              slug: blog.slug,
              meta_title: blog.meta_title ?? null,
              meta_description: blog.meta_description ?? null,
            },
          });
          stats.created++;
        }
        stats.processed++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ blogs: duplicate row skipped (id=${blog.id}, slug=${blog.slug})`);
        } else {
          throw error;
        }
      }
      logProgress("blogs", index + 1, blogs.length, stats);
    }
    overall.set("blogs", stats);
    logSummary("blogs", stats);
  }

  if (careers.length) {
    const stats = makeStats();
    logSection("careers", careers.length);
    for (const [index, career] of (careers as SqliteRow[]).entries()) {
      const existing = await tx.career.findUnique({ where: { id: career.id } });

      try {
        await tx.career.upsert({
          where: { id: career.id },
          update: {
            title: career.title,
            location: career.location ?? null,
            type: career.type ?? null,
            description: career.description ?? null,
            requirements: career.requirements ?? null,
            apply_link: career.apply_link ?? null,
          },
          create: {
            id: career.id,
            title: career.title,
            location: career.location ?? null,
            type: career.type ?? null,
            description: career.description ?? null,
            requirements: career.requirements ?? null,
            apply_link: career.apply_link ?? null,
          },
        });
        stats.processed++;
        if (existing) stats.updated++;
        else stats.created++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ careers: duplicate id skipped (${career.id})`);
        } else {
          throw error;
        }
      }
      logProgress("careers", index + 1, careers.length, stats);
    }
    overall.set("careers", stats);
    logSummary("careers", stats);
  }

  if (propertyTypes.length) {
    const stats = makeStats();
    logSection("property_types", propertyTypes.length);
    for (const [index, propertyType] of (propertyTypes as SqliteRow[]).entries()) {
      const existing = await tx.propertyType.findFirst({
        where: { OR: [{ id: propertyType.id }, { name: propertyType.name }] },
      });

      try {
        if (existing) {
          await tx.propertyType.update({
            where: { id: existing.id },
            data: { name: propertyType.name },
          });
          stats.updated++;
        } else {
          await tx.propertyType.upsert({
            where: { name: propertyType.name },
            update: { created_at: toDate(propertyType.created_at) ?? new Date() },
            create: {
              name: propertyType.name,
              created_at: toDate(propertyType.created_at) ?? new Date(),
            },
          });
          stats.created++;
        }
        stats.processed++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ property_types: duplicate name skipped (${propertyType.name})`);
        } else {
          throw error;
        }
      }
      logProgress("property_types", index + 1, propertyTypes.length, stats);
    }
    overall.set("property_types", stats);
    logSummary("property_types", stats);
  }

  if (amenities.length) {
    const stats = makeStats();
    logSection("amenities", amenities.length);
    for (const [index, amenity] of (amenities as SqliteRow[]).entries()) {
      const existing = await tx.amenity.findFirst({
        where: { OR: [{ id: amenity.id }, { name: amenity.name }] },
      });

      try {
        if (existing) {
          const updated = await tx.amenity.update({
            where: { id: existing.id },
            data: { name: amenity.name },
          });
          amenityIdMap.set(amenity.id, updated.id);
          stats.updated++;
        } else {
          const created = await tx.amenity.upsert({
            where: { name: amenity.name },
            update: { created_at: toDate(amenity.created_at) ?? new Date() },
            create: {
              name: amenity.name,
              created_at: toDate(amenity.created_at) ?? new Date(),
            },
          });
          amenityIdMap.set(amenity.id, created.id);
          stats.created++;
        }
        stats.processed++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ amenities: duplicate name skipped (${amenity.name})`);
        } else {
          throw error;
        }
      }
      logProgress("amenities", index + 1, amenities.length, stats);
    }
    overall.set("amenities", stats);
    logSummary("amenities", stats);
  }

  if (projectAmenities.length) {
    const stats = makeStats();
    logSection("project_amenities", projectAmenities.length);
    for (const [index, projectAmenity] of (projectAmenities as SqliteRow[]).entries()) {
      const mappedProjectId = relationId(
        projectIdMap,
        projectAmenity.project_id,
        "project",
        "project_amenity",
        projectAmenity.project_id,
      );
      const mappedAmenityId = relationId(
        amenityIdMap,
        projectAmenity.amenity_id,
        "amenity",
        "project_amenity",
        projectAmenity.project_id,
      );

      if (!mappedProjectId || !mappedAmenityId) {
        stats.processed++;
        stats.skipped++;
        logProgress("project_amenities", index + 1, projectAmenities.length, stats);
        continue;
      }

      const existing = await tx.projectAmenity.findUnique({
        where: {
          project_id_amenity_id: {
            project_id: mappedProjectId,
            amenity_id: mappedAmenityId,
          },
        },
      });

      try {
        await tx.projectAmenity.upsert({
          where: {
            project_id_amenity_id: {
              project_id: mappedProjectId,
              amenity_id: mappedAmenityId,
            },
          },
          update: {},
          create: {
            project_id: mappedProjectId,
            amenity_id: mappedAmenityId,
          },
        });
        stats.processed++;
        if (existing) stats.updated++;
        else stats.created++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ project_amenities: duplicate relation skipped (${mappedProjectId}, ${mappedAmenityId})`);
        } else {
          throw error;
        }
      }
      logProgress("project_amenities", index + 1, projectAmenities.length, stats);
    }
    overall.set("project_amenities", stats);
    logSummary("project_amenities", stats);
  }

  if (leads.length) {
    const stats = makeStats();
    logSection("leads", leads.length);
    for (const [index, lead] of (leads as SqliteRow[]).entries()) {
      const mappedProjectId = relationId(projectIdMap, lead.project_id, "project", "lead", lead.id);
      const existing = await tx.lead.findUnique({ where: { id: lead.id } });

      try {
        await tx.lead.upsert({
          where: { id: lead.id },
          update: {
            name: lead.name,
            email: lead.email,
            phone: lead.phone ?? null,
            message: lead.message ?? null,
            project_id: mappedProjectId,
            created_at: toDate(lead.created_at) ?? new Date(),
          },
          create: {
            id: lead.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone ?? null,
            message: lead.message ?? null,
            project_id: mappedProjectId,
            created_at: toDate(lead.created_at) ?? new Date(),
          },
        });
        stats.processed++;
        if (existing) stats.updated++;
        else stats.created++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ leads: duplicate id skipped (${lead.id})`);
        } else {
          throw error;
        }
      }
      logProgress("leads", index + 1, leads.length, stats);
    }
    overall.set("leads", stats);
    logSummary("leads", stats);
  }

  if (newsletters.length) {
    const stats = makeStats();
    logSection("newsletter_subs", newsletters.length);
    for (const [index, newsletter] of (newsletters as SqliteRow[]).entries()) {
      const existing = await tx.newsletterSubscriber.findUnique({ where: { email: newsletter.email } });

      try {
        await tx.newsletterSubscriber.upsert({
          where: { email: newsletter.email },
          update: {
            created_at: toDate(newsletter.created_at) ?? new Date(),
          },
          create: {
            email: newsletter.email,
            created_at: toDate(newsletter.created_at) ?? new Date(),
          },
        });
        stats.processed++;
        if (existing) stats.updated++;
        else stats.created++;
      } catch (error) {
        stats.failed++;
        if (isPrismaDuplicateError(error)) {
          stats.skipped++;
          log(`   ⚠ newsletter_subs: duplicate email skipped (${newsletter.email})`);
        } else {
          throw error;
        }
      }
      logProgress("newsletter_subs", index + 1, newsletters.length, stats);
    }
    overall.set("newsletter_subs", stats);
    logSummary("newsletter_subs", stats);
  }

  await syncSequences();

  log(`\n📊 Migration summary:`);
  for (const [label, stats] of overall.entries()) {
    logSummary(label, stats);
  }

  log(`\n✅ Migration complete!\n`);
}

main()
  .catch((err) => {
    console.error("\n✖  Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
