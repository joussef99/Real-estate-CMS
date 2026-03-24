import "dotenv/config";
import { prisma } from "../lib/prisma.ts";

type LegacyItem = {
  model: string;
  id: number;
  field: string;
  value: string;
};

const shouldApply = process.argv.includes("--apply-nullify");

function isLegacyUploadPath(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/uploads/");
}

function parseGallery(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((item): item is string => typeof item === "string");
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  const legacyItems: LegacyItem[] = [];

  const [projects, developers, destinations, blogs] = await Promise.all([
    prisma.project.findMany({ select: { id: true, main_image: true, gallery: true } }),
    prisma.developer.findMany({ select: { id: true, logo: true } }),
    prisma.destination.findMany({ select: { id: true, image: true } }),
    prisma.blog.findMany({ select: { id: true, image: true } }),
  ]);

  projects.forEach((project) => {
    if (isLegacyUploadPath(project.main_image)) {
      legacyItems.push({ model: "project", id: project.id, field: "main_image", value: project.main_image });
    }

    const gallery = parseGallery(project.gallery);
    gallery
      .filter((item) => isLegacyUploadPath(item))
      .forEach((item) => {
        legacyItems.push({ model: "project", id: project.id, field: "gallery", value: item });
      });
  });

  developers.forEach((developer) => {
    if (isLegacyUploadPath(developer.logo)) {
      legacyItems.push({ model: "developer", id: developer.id, field: "logo", value: developer.logo });
    }
  });

  destinations.forEach((destination) => {
    if (isLegacyUploadPath(destination.image)) {
      legacyItems.push({ model: "destination", id: destination.id, field: "image", value: destination.image });
    }
  });

  blogs.forEach((blog) => {
    if (isLegacyUploadPath(blog.image)) {
      legacyItems.push({ model: "blog", id: blog.id, field: "image", value: blog.image });
    }
  });

  const summary = legacyItems.reduce<Record<string, number>>((acc, item) => {
    const key = `${item.model}.${item.field}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log("Legacy /uploads image reference audit");
  console.log(JSON.stringify({ total: legacyItems.length, summary }, null, 2));

  if (!legacyItems.length) {
    return;
  }

  console.log("Affected entries (re-upload recommended):");
  legacyItems.forEach((item) => {
    console.log(`- ${item.model}#${item.id} ${item.field}: ${item.value}`);
  });

  if (!shouldApply) {
    console.log("\nRun with --apply-nullify to set legacy image fields to null and strip legacy gallery items.");
    return;
  }

  for (const project of projects) {
    const updates: { main_image?: null; gallery?: string } = {};

    if (isLegacyUploadPath(project.main_image)) {
      updates.main_image = null;
    }

    const gallery = parseGallery(project.gallery);
    const cleanedGallery = gallery.filter((item) => !isLegacyUploadPath(item));
    if (cleanedGallery.length !== gallery.length) {
      updates.gallery = JSON.stringify(cleanedGallery);
    }

    if (Object.keys(updates).length > 0) {
      await prisma.project.update({ where: { id: project.id }, data: updates });
    }
  }

  for (const developer of developers) {
    if (isLegacyUploadPath(developer.logo)) {
      await prisma.developer.update({ where: { id: developer.id }, data: { logo: null } });
    }
  }

  for (const destination of destinations) {
    if (isLegacyUploadPath(destination.image)) {
      await prisma.destination.update({ where: { id: destination.id }, data: { image: null } });
    }
  }

  for (const blog of blogs) {
    if (isLegacyUploadPath(blog.image)) {
      await prisma.blog.update({ where: { id: blog.id }, data: { image: null } });
    }
  }

  console.log("\nNullify mode complete: legacy paths have been cleared for re-upload.");
}

main()
  .catch((error) => {
    console.error("Legacy image audit failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
