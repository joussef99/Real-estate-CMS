import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls } from "../utils/imageUrl.ts";
import { deleteImages, getPublicIdFromMedia, getPublicIdsFromMediaCollection } from "../services/mediaService.ts";

const makeUniqueSlug = async (baseName: string, currentId?: number): Promise<string> => {
  let slug = generateSlug(baseName) || `destination-${Date.now()}`;
  const baseSlug = slug;
  let count = 1;

  while (true) {
    const existing = await prisma.destination.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

export async function getDestinations(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 0;
  const page = parseInt(req.query.page as string) || 1;
  const includeProjectPreviews = ["1", "true"].includes(String(req.query.include_project_previews || "").toLowerCase());
  const previewLimit = parseInt(req.query.project_preview_limit as string) || 2;

  if (limit <= 0 && !req.query.page && !includeProjectPreviews) {
    const destinations = await prisma.destination.findMany({
      include: { _count: { select: { projects: true } } },
      orderBy: { id: "desc" },
    });
    const mapped = destinations.map((d) => ({
      id: d.id,
      public_id: d.public_id,
      name: d.name,
      image: d.image || (d as any).image_meta?.url || null,
      image_meta: (d as any).image_meta ?? null,
      description: d.description,
      slug: d.slug,
      project_count: d._count.projects,
    }));
    return res.json(mapped.map((d) => transformImagesToFullUrls(req, d, ["image"])));
  }

  const total = await prisma.destination.count();
  const total_pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const destinations = await prisma.destination.findMany({
    include: { _count: { select: { projects: true } } },
    orderBy: { id: "desc" },
    ...(limit > 0 ? { take: limit, skip: offset } : {}),
  });

  const mappedDestinations = destinations.map((d) => ({
    id: d.id,
    public_id: d.public_id,
    name: d.name,
    image: d.image || (d as any).image_meta?.url || null,
    image_meta: (d as any).image_meta ?? null,
    description: d.description,
    slug: d.slug,
    project_count: d._count.projects,
  }));

  const enrichedDestinations = includeProjectPreviews
    ? await Promise.all(mappedDestinations.map(async (destination) => {
        const destWithImages = transformImagesToFullUrls(req, destination, ["image"]);
        const previewProjects = await prisma.project.findMany({
          where: { destination_id: destination.id },
          include: {
            developer: { select: { name: true } },
            destination: { select: { name: true, slug: true } },
          },
          orderBy: { id: "desc" },
          take: previewLimit,
        });

        const mappedProjects = previewProjects.map((p) => ({
          id: p.id,
          public_id: p.public_id,
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
          ...destWithImages,
          preview_projects: mappedProjects.map((p) => transformImagesToFullUrls(req, p, ["main_image"])),
        };
      }))
    : mappedDestinations.map((d) => transformImagesToFullUrls(req, d, ["image"]));

  return res.json({
    destinations: enrichedDestinations,
    total,
    total_pages,
    current_page: Math.max(page, 1),
    limit: limit || total,
  });
}

export async function getDestinationProjects(req: Request, res: Response) {
  const identifier = req.params.identifier;
  const destination = /^\d+$/.test(identifier)
    ? await prisma.destination.findUnique({
        where: { id: parseInt(identifier, 10) },
        select: { id: true, public_id: true, name: true, slug: true, image: true, image_meta: true, description: true },
      })
    : await prisma.destination.findFirst({
        where: {
          OR: [{ slug: identifier }, { public_id: identifier }],
        },
        select: { id: true, public_id: true, name: true, slug: true, image: true, image_meta: true, description: true },
      });
  if (!destination) {
    return res.status(404).json({ error: "Destination not found" });
  }

  const projects = await prisma.project.findMany({
    where: { destination_id: destination.id },
    include: {
      developer: { select: { name: true } },
      destination: { select: { name: true, slug: true } },
    },
    orderBy: { id: "desc" },
  });

  const mappedProjects = projects.map((p) => ({
    id: p.id,
    public_id: p.public_id,
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

  const destWithImages = transformImagesToFullUrls(req, { ...destination, image: destination.image || (destination as any).image_meta?.url || null }, ["image"]);
  const projectsWithImages = mappedProjects.map((p) => transformImagesToFullUrls(req, p, ["main_image"]));

  return res.json({ destination: destWithImages, projects: projectsWithImages });
}

export async function createDestination(req: Request, res: Response) {
  const { name, image, image_meta, description } = req.body;
  const slug = await makeUniqueSlug(name);
  const created = await prisma.destination.create({ data: { name, image, image_meta: image_meta || null, description, slug } });
  return res.json({ id: created.id, public_id: created.public_id, slug });
}

export async function updateDestination(req: Request, res: Response) {
  const { name, image, image_meta, description } = req.body;
  const id = parseInt(req.params.id, 10);
  const existing = await prisma.destination.findUnique({ where: { id }, select: { image_meta: true } });
  const slug = await makeUniqueSlug(name, id);

  const previousPublicId = getPublicIdFromMedia(existing?.image_meta);
  const nextPublicId = getPublicIdFromMedia(image_meta || image);
  if (previousPublicId && previousPublicId !== nextPublicId) {
    await deleteImages([previousPublicId]);
  }

  await prisma.destination.update({
    where: { id },
    data: { name, image, image_meta: image_meta || null, description, slug },
  });
  return res.json({ success: true, slug });
}

export async function deleteDestination(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existing = await prisma.destination.findUnique({ where: { id }, select: { image: true, image_meta: true } });
  const publicIds = getPublicIdsFromMediaCollection([existing?.image_meta, existing?.image]);

  await prisma.destination.delete({ where: { id } });
  await deleteImages(publicIds);

  return res.json({ success: true });
}
