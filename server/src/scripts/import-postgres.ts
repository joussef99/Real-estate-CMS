import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma.ts";

const INPUT_PATH = process.env.IMPORT_PATH || path.resolve(process.cwd(), "data-export.json");

function toDate(value: any) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

async function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Import file not found: ${INPUT_PATH}`);
  }

  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const data = JSON.parse(raw) as Record<string, any[]>;

  await prisma.$transaction(async (tx) => {
    await tx.projectAmenity.deleteMany({});
    await tx.lead.deleteMany({});
    await tx.project.deleteMany({});
    await tx.blog.deleteMany({});
    await tx.career.deleteMany({});
    await tx.propertyType.deleteMany({});
    await tx.amenity.deleteMany({});
    await tx.destination.deleteMany({});
    await tx.developer.deleteMany({});
    await tx.newsletterSubscriber.deleteMany({});
    await tx.user.deleteMany({});

    if (data.users?.length) {
      await tx.user.createMany({ data: data.users });
    }
    if (data.developers?.length) {
      await tx.developer.createMany({ data: data.developers });
    }
    if (data.destinations?.length) {
      await tx.destination.createMany({ data: data.destinations });
    }
    if (data.projects?.length) {
      await tx.project.createMany({ data: data.projects });
    }
    if (data.blogs?.length) {
      await tx.blog.createMany({
        data: data.blogs.map((blog) => ({ ...blog, created_at: toDate(blog.created_at) || new Date() })),
      });
    }
    if (data.careers?.length) {
      await tx.career.createMany({ data: data.careers });
    }
    if (data.property_types?.length) {
      await tx.propertyType.createMany({
        data: data.property_types.map((item) => ({ ...item, created_at: toDate(item.created_at) || new Date() })),
      });
    }
    if (data.amenities?.length) {
      await tx.amenity.createMany({
        data: data.amenities.map((item) => ({ ...item, created_at: toDate(item.created_at) || new Date() })),
      });
    }
    if (data.leads?.length) {
      await tx.lead.createMany({
        data: data.leads.map((lead) => ({ ...lead, created_at: toDate(lead.created_at) || new Date() })),
      });
    }
    if (data.project_amenities?.length) {
      await tx.projectAmenity.createMany({ data: data.project_amenities, skipDuplicates: true });
    }
    if (data.newsletter_subscribers?.length) {
      await tx.newsletterSubscriber.createMany({
        data: data.newsletter_subscribers.map((item) => ({ ...item, created_at: toDate(item.created_at) || new Date() })),
      });
    }
  });

  console.log("PostgreSQL import completed successfully.");
}

main()
  .catch((err) => {
    console.error("PostgreSQL import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
