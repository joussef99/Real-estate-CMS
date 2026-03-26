import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls } from "../utils/imageUrl.ts";
import { deleteImages, getPublicIdFromMedia, getPublicIdsFromMediaCollection } from "../services/mediaService.ts";

const makeUniqueSlug = async (baseName: string, currentId?: number): Promise<string> => {
  let slug = generateSlug(baseName) || `developer-${Date.now()}`;
  const baseSlug = slug;
  let count = 1;

  while (true) {
    const existing = await prisma.developer.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

export async function getDevelopers(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 0;
  const page = parseInt(req.query.page as string) || 1;
  const includeProjectPreviews = ["1", "true"].includes(String(req.query.include_project_previews || "").toLowerCase());
  const previewLimit = parseInt(req.query.project_preview_limit as string) || 2;

  if (limit <= 0 && !req.query.page && !includeProjectPreviews) {
    const developers = await prisma.developer.findMany({
      select: { id: true, name: true, logo: true, logo_meta: true, description: true, slug: true },
      orderBy: { id: "desc" },
    });
    const transformedDevelopers = (developers as any[])
      .map((d) => ({ ...d, logo: d.logo || d.logo_meta?.url || null }))
      .map((d) => transformImagesToFullUrls(req, d, ["logo"]));
    return res.json(transformedDevelopers);
  }

  const total = await prisma.developer.count();
  const total_pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const developers = await prisma.developer.findMany({
    select: { id: true, name: true, logo: true, logo_meta: true, description: true, slug: true },
    orderBy: { id: "desc" },
    ...(limit > 0 ? { take: limit, skip: offset } : {}),
  });

  const enrichedDevelopers = includeProjectPreviews
    ? await Promise.all(developers.map(async (developer) => {
        const devWithImages = transformImagesToFullUrls(req, { ...developer, logo: developer.logo || (developer as any).logo_meta?.url || null }, ["logo"]);
        const previewProjects = await prisma.project.findMany({
          where: { developer_id: developer.id },
          include: {
            developer: { select: { name: true } },
            destination: { select: { name: true, slug: true } },
          },
          orderBy: { id: "desc" },
          take: previewLimit,
        });

        const mappedProjects = previewProjects.map((p) => ({
          id: p.id,
          name: p.name,
          location: p.location,
          price_range: p.price_range,
          downPayment: p.downPayment,
          type: p.type,
          main_image: p.main_image,
          developer_id: p.developer_id,
          destination_id: p.destination_id,
          beds: p.beds,
          size: p.size,
          slug: p.slug,
          developer_name: p.developer?.name,
          destination_name: p.destination?.name,
          destination_slug: p.destination?.slug,
        }));

        return {
          ...devWithImages,
          preview_projects: mappedProjects.map((p) => transformImagesToFullUrls(req, p, ["main_image"])),
        };
      }))
    : developers
      .map((d) => ({ ...d, logo: d.logo || (d as any).logo_meta?.url || null }))
      .map((d) => transformImagesToFullUrls(req, d, ["logo"]));

  return res.json({
    developers: enrichedDevelopers,
    total,
    total_pages,
    current_page: Math.max(page, 1),
    limit: limit || total,
  });
}

export async function createDeveloper(req: Request, res: Response) {
  const { name, logo, logo_meta, description } = req.body;
  const slug = await makeUniqueSlug(name);
  const created = await prisma.developer.create({
    data: { name, logo, logo_meta: logo_meta || null, description, slug },
  });
  return res.json({ id: created.id, slug });
}

export async function updateDeveloper(req: Request, res: Response) {
  const { name, logo, logo_meta, description } = req.body;
  const id = parseInt(req.params.id, 10);
  const existing = await prisma.developer.findUnique({ where: { id }, select: { logo_meta: true } });
  const slug = await makeUniqueSlug(name, id);

  const previousPublicId = getPublicIdFromMedia(existing?.logo_meta);
  const nextPublicId = getPublicIdFromMedia(logo_meta || logo);
  if (previousPublicId && previousPublicId !== nextPublicId) {
    await deleteImages([previousPublicId]);
  }

  await prisma.developer.update({
    where: { id },
    data: { name, logo, logo_meta: logo_meta || null, description, slug },
  });
  return res.json({ success: true, slug });
}

export async function deleteDeveloper(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.developer.findUnique({ where: { id }, select: { logo: true, logo_meta: true } });
  const publicIds = getPublicIdsFromMediaCollection([existing?.logo_meta, existing?.logo]);

  await prisma.developer.delete({ where: { id } });
  await deleteImages(publicIds);

  return res.json({ success: true });
}

export async function getDeveloperProjects(req: Request, res: Response) {
  const developer = await prisma.developer.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, name: true },
  });
  if (!developer) {
    return res.status(404).json({ error: "Developer not found" });
  }

  const projects = await prisma.project.findMany({
    where: { developer_id: developer.id },
    include: {
      developer: { select: { name: true } },
      destination: { select: { name: true, slug: true } },
    },
    orderBy: { id: "desc" },
  });

  const mappedProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    location: p.location,
    price_range: p.price_range,
    downPayment: p.downPayment,
    type: p.type,
    main_image: p.main_image,
    developer_id: p.developer_id,
    destination_id: p.destination_id,
    beds: p.beds,
    size: p.size,
    slug: p.slug,
    developer_name: p.developer?.name,
    destination_name: p.destination?.name,
    destination_slug: p.destination?.slug,
  }));

  const projectsWithImages = mappedProjects.map((p) => transformImagesToFullUrls(req, p, ["main_image"]));
  return res.json(projectsWithImages);
}
