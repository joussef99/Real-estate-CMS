import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls, transformGalleryToFullUrls } from "../utils/imageUrl.ts";
import { makeUniqueProjectSlug, normalizePropertyPayload } from "../services/propertiesService.ts";

const toPositiveInteger = (value: unknown) => {
  const parsed = parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const toNullableNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getProjectPriceBounds = (priceRange?: string | null) => {
  if (!priceRange) {
    return { min: null as number | null, max: null as number | null };
  }

  const regex = /(\d+(?:[.,]\d+)?)\s*([kmb])?/gi;
  const values: number[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(priceRange)) !== null) {
    const normalizedNumber = match[1].replace(/,/g, "");
    let value = parseFloat(normalizedNumber);

    if (!Number.isFinite(value)) continue;

    switch ((match[2] || "").toLowerCase()) {
      case "b":
        value *= 1000000000;
        break;
      case "m":
        value *= 1000000;
        break;
      case "k":
        value *= 1000;
        break;
      default:
        break;
    }

    values.push(value);
  }

  if (!values.length) {
    return { min: null as number | null, max: null as number | null };
  }

  return {
    min: values[0] ?? null,
    max: values[values.length - 1] ?? values[0] ?? null,
  };
};

const mapProjectCard = (project: any) => ({
  id: project.id,
  name: project.name,
  location: project.location,
  price_range: project.price_range,
  type: project.type,
  main_image: project.main_image,
  developer_id: project.developer_id,
  destination_id: project.destination_id,
  beds: project.beds,
  size: project.size,
  slug: project.slug,
  developer_name: project.developer?.name ?? null,
  destination_name: project.destination?.name ?? null,
  destination_slug: project.destination?.slug ?? null,
});

const mapProjectDetail = (project: any) => ({
  id: project.id,
  name: project.name,
  location: project.location,
  price_range: project.price_range,
  type: project.type,
  status: project.status,
  description: project.description,
  main_image: project.main_image,
  gallery: project.gallery,
  amenities: project.amenities,
  developer_id: project.developer_id,
  destination_id: project.destination_id,
  is_featured: project.is_featured,
  featured: project.featured,
  beds: project.beds,
  size: project.size,
  slug: project.slug,
  meta_title: project.meta_title,
  meta_description: project.meta_description,
  developer_name: project.developer?.name ?? null,
  destination_name: project.destination?.name ?? null,
  destination_slug: project.destination?.slug ?? null,
});

const validateProjectInput = (body: any) => {
  const errors: string[] = [];

  const name = typeof body?.name === "string"
    ? body.name.trim()
    : typeof body?.title === "string"
      ? body.title.trim()
      : "";
  if (!name) {
    errors.push("Property title is required");
  }

  const priceValue = body?.price_range ?? body?.price;
  if (priceValue !== undefined && priceValue !== null && typeof priceValue !== "string") {
    errors.push("price_range must be a string");
  }

  if (body?.gallery !== undefined && !Array.isArray(body.gallery)) {
    errors.push("gallery must be an array");
  }

  if (body?.amenities !== undefined && !Array.isArray(body.amenities)) {
    errors.push("amenities must be an array");
  }

  return errors;
};

const makeUniqueSlug = async (baseSlug: string, currentId?: number): Promise<string> => {
  return makeUniqueProjectSlug(baseSlug, currentId);
};

const resolveProject = async (identifier: string) => {
  if (!identifier) return null;

  if (/^\d+$/.test(identifier)) {
    return prisma.project.findUnique({ where: { id: parseInt(identifier, 10) } });
  }

  return prisma.project.findUnique({ where: { slug: identifier } });
};

export async function getProjects(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 1000;
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * limit;
  const developer_id = req.query.developer_id ? parseInt(req.query.developer_id as string, 10) : null;

  const where = developer_id ? { developer_id } : undefined;
  const total = await prisma.project.count({ where });
  const total_pages = Math.ceil(total / limit);

  if (page < 1 || page > Math.max(total_pages, 1)) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  const projects = await prisma.project.findMany({
    where,
    include: {
      developer: { select: { name: true } },
      destination: { select: { name: true, slug: true } },
    },
    orderBy: { id: "desc" },
    take: limit,
    skip: offset,
  });

  const transformedProjects = projects.map((p) => transformImagesToFullUrls(req, mapProjectCard(p), ["main_image"]));

  return res.json({
    projects: transformedProjects,
    total_pages,
    current_page: page,
    total,
    limit,
  });
}

export async function searchProjects(req: Request, res: Response) {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 48);
  const offset = (page - 1) * limit;

  const destination_id = toPositiveInteger(req.query.destination ?? req.query.destination_id);
  const developer_id = toPositiveInteger(req.query.developer ?? req.query.developer_id);
  const property_type = String(req.query.property_type ?? req.query.types ?? "").split(",").map((value) => value.trim()).find(Boolean) || null;
  const price_min = toNullableNumber(req.query.price_min);
  const price_max = toNullableNumber(req.query.price_max);
  const bedrooms = req.query.bedrooms as string || null;
  const amenities = req.query.amenities ? (req.query.amenities as string).split(",").map((a) => parseInt(a, 10)).filter(Number.isFinite) : null;
  const keyword = String(req.query.keyword ?? req.query.q ?? "").trim();

  const where: any = {
    ...(destination_id ? { destination_id } : {}),
    ...(developer_id ? { developer_id } : {}),
    ...(property_type ? { type: property_type } : {}),
    ...(bedrooms ? { beds: { contains: bedrooms, mode: "insensitive" as const } } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: "insensitive" as const } },
            { location: { contains: keyword, mode: "insensitive" as const } },
            { type: { contains: keyword, mode: "insensitive" as const } },
            { developer: { name: { contains: keyword, mode: "insensitive" as const } } },
            { destination: { name: { contains: keyword, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };

  let projects = await prisma.project.findMany({
    where,
    include: {
      developer: { select: { name: true } },
      destination: { select: { name: true, slug: true } },
      projectAmenities: { select: { amenity_id: true } },
    },
    orderBy: { id: "desc" },
  });

  if (amenities && amenities.length > 0) {
    projects = projects.filter((project) => {
      const projectAmenityIds = project.projectAmenities.map((pa) => pa.amenity_id);
      return amenities.every((amenity_id) => projectAmenityIds.includes(amenity_id));
    });
  }

  if (price_min !== null || price_max !== null) {
    projects = projects.filter((project) => {
      const { min, max } = getProjectPriceBounds(project.price_range as string | null);
      const lowerBound = min ?? max;
      const upperBound = max ?? min;

      if (lowerBound === null || upperBound === null) {
        return false;
      }

      if (price_min !== null && upperBound < price_min) {
        return false;
      }

      if (price_max !== null && lowerBound > price_max) {
        return false;
      }

      return true;
    });
  }

  const total = projects.length;
  const total_pages = Math.max(Math.ceil(total / limit), 1);

  if (page > total_pages && total > 0) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  const paginatedProjects = projects.slice(offset, offset + limit);
  const transformedProjects = paginatedProjects
    .map((p) => mapProjectCard(p))
    .map((p) => transformImagesToFullUrls(req, p, ["main_image"]));

  return res.json({
    projects: transformedProjects,
    total_pages,
    current_page: page,
    total,
    limit,
  });
}

export async function getFeaturedProjects(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 0;

  const featuredProjects = await prisma.project.findMany({
    where: {
      OR: [{ featured: 1 }, { is_featured: 1 }],
    },
    include: {
      developer: { select: { name: true } },
      destination: { select: { name: true, slug: true } },
    },
    orderBy: { id: "desc" },
    ...(limit > 0 ? { take: limit } : {}),
  });

  const transformedProjects = featuredProjects
    .map((p) => mapProjectCard(p))
    .map((p) => transformImagesToFullUrls(req, p, ["main_image"]));

  return res.json({ projects: transformedProjects });
}

export async function getProjectAmenities(req: Request, res: Response) {
  const identifier = req.params.identifier;
  const project = await resolveProject(identifier);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  const amenities = await prisma.projectAmenity.findMany({
    where: { project_id: project.id },
    include: { amenity: { select: { name: true } } },
  });

  return res.json(amenities.map((pa) => ({ amenity_id: pa.amenity_id, name: pa.amenity.name })));
}

export async function getProjectGallery(req: Request, res: Response) {
  const identifier = req.params.identifier;
  const project = await resolveProject(identifier);

  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  let gallery = [] as string[];
  try {
    const rawGallery = project.gallery;
    if (rawGallery) {
      gallery = typeof rawGallery === "string" ? JSON.parse(rawGallery) : rawGallery;
    }
  } catch {
    gallery = [];
  }

  const images = [project.main_image, ...(Array.isArray(gallery) ? gallery : [])].filter((img: any) => img);
  const fullImageUrls = images.map((img) => transformImagesToFullUrls(req, { img }, ["img"]).img);
  return res.json(fullImageUrls);
}

export async function getProjectByIdentifier(req: Request, res: Response) {
  const identifier = req.params.identifier;

  if (!identifier) {
    return res.status(404).json({ error: "Not found" });
  }

  const project = /^\d+$/.test(identifier)
    ? await prisma.project.findUnique({
        where: { id: parseInt(identifier, 10) },
        include: {
          developer: { select: { name: true } },
          destination: { select: { name: true, slug: true } },
        },
      })
    : await prisma.project.findUnique({
        where: { slug: identifier },
        include: {
          developer: { select: { name: true } },
          destination: { select: { name: true, slug: true } },
        },
      });

  if (!project) return res.status(404).json({ error: "Not found" });

  const mapped = mapProjectDetail(project);
  const withFullImage = transformImagesToFullUrls(req, mapped, ["main_image"]);

  if (withFullImage.gallery) {
    withFullImage.gallery = transformGalleryToFullUrls(req, withFullImage.gallery);
  }

  return res.json(withFullImage);
}

export async function createProject(req: Request, res: Response) {
  const validationErrors = validateProjectInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const {
    name,
    title,
    location,
    price_range,
    price,
    type,
    status,
    description,
    gallery,
    amenities,
    developer_id,
    destination_id,
    is_featured,
    featured,
    beds,
    size,
    slug,
    meta_title,
    meta_description,
  } = req.body;

  const effectiveName = (typeof name === "string" && name.trim()) || (typeof title === "string" ? title.trim() : "");
  const effectivePriceRange = price_range ?? price ?? null;

  const normalized = normalizePropertyPayload({
    name: effectiveName,
    location,
    price_range: effectivePriceRange,
    type,
    status,
    description,
    gallery,
    amenities,
    developer_id,
    destination_id,
    is_featured,
    featured,
    beds,
    size,
    slug,
    meta_title,
    meta_description,
  });
  const finalSlug = await makeUniqueSlug(generateSlug(normalized.slugCandidate));

  const created = await prisma.project.create({
    data: {
      name: normalized.name,
      location: normalized.location,
      price_range: normalized.price_range,
      type: normalized.type,
      status: normalized.status,
      description: normalized.description,
      gallery: normalized.gallery,
      developer_id: normalized.developer_id,
      destination_id: normalized.destination_id,
      is_featured: normalized.is_featured,
      featured: normalized.featured,
      beds: normalized.beds,
      size: normalized.size,
      main_image: normalized.main_image,
      slug: finalSlug,
      meta_title: normalized.meta_title,
      meta_description: normalized.meta_description,
    },
  });

  if (normalized.amenities.length > 0) {
    await prisma.projectAmenity.createMany({
      data: normalized.amenities.map((amenityId: number) => ({
        project_id: created.id,
        amenity_id: Number(amenityId),
      })),
      skipDuplicates: true,
    });
  }

  return res.json({ id: created.id, slug: finalSlug });
}

export async function updateProject(req: Request, res: Response) {
  const validationErrors = validateProjectInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const {
    name,
    title,
    location,
    price_range,
    price,
    type,
    status,
    description,
    gallery,
    amenities,
    developer_id,
    destination_id,
    is_featured,
    featured,
    beds,
    size,
    slug,
    meta_title,
    meta_description,
  } = req.body;

  const projectId = parseInt(req.params.id, 10);
  const effectiveName = (typeof name === "string" && name.trim()) || (typeof title === "string" ? title.trim() : "");
  const effectivePriceRange = price_range ?? price ?? null;
  const normalized = normalizePropertyPayload(
    {
      name: effectiveName,
      location,
      price_range: effectivePriceRange,
      type,
      status,
      description,
      gallery,
      amenities,
      developer_id,
      destination_id,
      is_featured,
      featured,
      beds,
      size,
      slug,
      meta_title,
      meta_description,
    },
    projectId,
  );

  const finalSlug = await makeUniqueSlug(generateSlug(normalized.slugCandidate), projectId);

  await prisma.$transaction(async (tx) => {
    await tx.project.update({
      where: { id: projectId },
      data: {
        name: normalized.name,
        location: normalized.location,
        price_range: normalized.price_range,
        type: normalized.type,
        status: normalized.status,
        description: normalized.description,
        gallery: normalized.gallery,
        developer_id: normalized.developer_id,
        destination_id: normalized.destination_id,
        is_featured: normalized.is_featured,
        featured: normalized.featured,
        beds: normalized.beds,
        size: normalized.size,
        main_image: normalized.main_image,
        slug: finalSlug,
        meta_title: normalized.meta_title,
        meta_description: normalized.meta_description,
      },
    });

    await tx.projectAmenity.deleteMany({ where: { project_id: projectId } });

    if (normalized.amenities.length > 0) {
      await tx.projectAmenity.createMany({
        data: normalized.amenities.map((amenityId: number) => ({
          project_id: projectId,
          amenity_id: Number(amenityId),
        })),
        skipDuplicates: true,
      });
    }
  });

  return res.json({ success: true });
}

export async function duplicateProject(req: Request, res: Response) {
  const sourceProjectId = parseInt(req.params.id, 10);
  if (Number.isNaN(sourceProjectId)) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  const sourceProject = await prisma.project.findUnique({ where: { id: sourceProjectId } });
  if (!sourceProject) {
    return res.status(404).json({ error: "Project not found" });
  }

  const copiedName = `${sourceProject.name} Copy`;
  const copiedSlug = await makeUniqueSlug(generateSlug(copiedName || `project-${Date.now()}`));

  const duplicated = await prisma.project.create({
    data: {
      name: copiedName,
      location: sourceProject.location,
      price_range: sourceProject.price_range,
      type: sourceProject.type,
      status: sourceProject.status,
      description: sourceProject.description,
      gallery: sourceProject.gallery,
      developer_id: sourceProject.developer_id,
      destination_id: sourceProject.destination_id,
      is_featured: sourceProject.is_featured ? 1 : 0,
      featured: sourceProject.featured ? 1 : 0,
      beds: sourceProject.beds,
      size: sourceProject.size,
      main_image: sourceProject.main_image,
      slug: copiedSlug,
      meta_title: sourceProject.meta_title,
      meta_description: sourceProject.meta_description,
    },
  });

  const sourceAmenities = await prisma.projectAmenity.findMany({
    where: { project_id: sourceProjectId },
    select: { amenity_id: true },
  });

  if (sourceAmenities.length > 0) {
    await prisma.projectAmenity.createMany({
      data: sourceAmenities.map(({ amenity_id }) => ({
        project_id: duplicated.id,
        amenity_id,
      })),
      skipDuplicates: true,
    });
  }

  return res.json({ id: duplicated.id });
}

export async function deleteProject(req: Request, res: Response) {
  const projectId = parseInt(req.params.id, 10);
  if (Number.isNaN(projectId)) {
    return res.status(400).json({ error: "Invalid project id" });
  }

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) {
    return res.status(404).json({ error: "Project not found" });
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectAmenity.deleteMany({ where: { project_id: projectId } });
    await tx.lead.deleteMany({ where: { project_id: projectId } });
    await tx.project.delete({ where: { id: projectId } });
  });

  return res.json({ success: true, id: projectId });
}
