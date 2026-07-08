import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls, transformGalleryToFullUrls } from "../utils/imageUrl.ts";
import { makeUniqueResaleSlug, normalizeResaleListingPayload, toNullableNonNegativeInt } from "../services/resaleService.ts";
import { deleteImages, getPublicIdsFromMediaCollection, uploadImage } from "../services/mediaService.ts";
import { notifyAdmin } from "../services/notificationService.ts";
import { bedsMatchesFilter } from "../utils/bedsRange.ts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_TEXT_LENGTH = 5000;
const MAX_SHORT_TEXT_LENGTH = 200;

const toNullableNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

interface UploadedImageFile {
  buffer: Buffer;
  originalname: string;
}

const validateResaleSubmissionInput = (body: any) => {
  const errors: string[] = [];

  const ownerName = typeof body?.owner_name === "string" ? body.owner_name.trim() : "";
  if (!ownerName) errors.push("Owner name is required");
  else if (ownerName.length > MAX_SHORT_TEXT_LENGTH) errors.push("Owner name is too long");

  const ownerEmail = typeof body?.owner_email === "string" ? body.owner_email.trim() : "";
  if (!ownerEmail || !EMAIL_PATTERN.test(ownerEmail)) errors.push("A valid owner email is required");

  const location = typeof body?.location === "string" ? body.location.trim() : "";
  if (!location) errors.push("Location is required");
  else if (location.length > MAX_SHORT_TEXT_LENGTH) errors.push("Location is too long");

  if (body?.owner_phone !== undefined && body.owner_phone !== null && String(body.owner_phone).length > 40) {
    errors.push("Phone number is too long");
  }

  if (body?.delivery_time !== undefined && body.delivery_time !== null && String(body.delivery_time).length > MAX_SHORT_TEXT_LENGTH) {
    errors.push("Delivery time is too long");
  }

  if (body?.description !== undefined && body.description !== null && String(body.description).length > MAX_TEXT_LENGTH) {
    errors.push("Description is too long");
  }

  for (const field of ["installment_value", "remaining_amount", "remaining_installments"] as const) {
    if (body?.[field] !== undefined && body[field] !== null && body[field] !== "" && toNullableNonNegativeInt(body[field]) === undefined) {
      errors.push(`${field.replace(/_/g, " ")} must be a non-negative number`);
    }
  }

  return errors;
};

const validateResaleListingInput = (body: any) => {
  const errors: string[] = [];

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) errors.push("Title is required");

  if (body?.gallery !== undefined && !Array.isArray(body.gallery)) {
    errors.push("gallery must be an array");
  }

  if (body?.description !== undefined && body.description !== null && String(body.description).length > MAX_TEXT_LENGTH) {
    errors.push("Description is too long");
  }

  for (const field of ["installment_value", "remaining_amount", "remaining_installments"] as const) {
    if (body?.[field] !== undefined && body[field] !== null && body[field] !== "" && toNullableNonNegativeInt(body[field]) === undefined) {
      errors.push(`${field.replace(/_/g, " ")} must be a non-negative number`);
    }
  }

  return errors;
};

const mapListingCard = (listing: any) => ({
  id: listing.id,
  public_id: listing.public_id,
  title: listing.title,
  location: listing.location,
  price: listing.price,
  main_image: listing.main_image || listing.main_image_meta?.url || null,
  main_image_meta: listing.main_image_meta,
  beds: listing.beds,
  size: listing.size,
  unit_type: listing.unit_type,
  slug: listing.slug,
});

const mapListingDetail = (listing: any) => ({
  ...mapListingCard(listing),
  installment_value: listing.installment_value,
  remaining_amount: listing.remaining_amount,
  remaining_installments: listing.remaining_installments,
  delivery_time: listing.delivery_time,
  description: listing.description,
  gallery: listing.gallery,
  gallery_meta: listing.gallery_meta,
  status: listing.status,
  meta_title: listing.meta_title,
  meta_description: listing.meta_description,
  submission_id: listing.submission_id,
});

const resolveListing = async (identifier: string) => {
  if (!identifier) return null;

  if (/^\d+$/.test(identifier)) {
    return prisma.resaleListing.findUnique({ where: { id: parseInt(identifier, 10) } });
  }

  const byPublicId = await prisma.resaleListing.findUnique({ where: { public_id: identifier } });
  if (byPublicId) return byPublicId;

  return prisma.resaleListing.findUnique({ where: { slug: identifier } });
};

// ─── Public: submissions ────────────────────────────────────────────────────

export async function createResaleSubmission(req: Request, res: Response) {
  const validationErrors = validateResaleSubmissionInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const {
    owner_name, owner_email, owner_phone, location, unit_type, beds, size,
    asking_price, installment_value, remaining_amount, remaining_installments,
    delivery_time, description,
  } = req.body;

  const files = (req.files as UploadedImageFile[] | undefined) ?? [];
  const uploadedAssets = await Promise.all(
    files.map((file) => uploadImage(file, {
      folder: "resale-submissions",
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 72,
    })),
  );

  const submission = await prisma.resaleSubmission.create({
    data: {
      owner_name: owner_name.trim(),
      owner_email: owner_email.trim(),
      owner_phone: owner_phone || null,
      location: location.trim(),
      unit_type: unit_type || null,
      beds: beds || null,
      size: size || null,
      asking_price: asking_price || null,
      installment_value: toNullableNonNegativeInt(installment_value) ?? null,
      remaining_amount: toNullableNonNegativeInt(remaining_amount) ?? null,
      remaining_installments: toNullableNonNegativeInt(remaining_installments) ?? null,
      delivery_time: delivery_time || null,
      description: description || null,
      photos: uploadedAssets.length > 0 ? JSON.stringify(uploadedAssets.map((asset) => asset.url)) : null,
      photos_meta: uploadedAssets.length > 0 ? uploadedAssets : undefined,
    },
  });

  notifyAdmin({
    subject: `New resale submission: ${location}`,
    html: `
      <h2>New resale submission received</h2>
      <p><strong>Owner:</strong> ${owner_name}</p>
      <p><strong>Email:</strong> ${owner_email}</p>
      <p><strong>Phone:</strong> ${owner_phone || "(not provided)"}</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Unit type:</strong> ${unit_type || "(not provided)"}</p>
      <p><strong>Asking price:</strong> ${asking_price || "(not provided)"}</p>
      <p><strong>Installment value:</strong> ${installment_value || "(not provided)"}</p>
      <p><strong>Remaining amount:</strong> ${remaining_amount || "(not provided)"}</p>
      <p><strong>Remaining installments:</strong> ${remaining_installments || "(not provided)"}</p>
      <p><strong>Delivery time:</strong> ${delivery_time || "(not provided)"}</p>
      <p><strong>Description:</strong> ${description || "(not provided)"}</p>
      <p><strong>Photos attached:</strong> ${uploadedAssets.length}</p>
    `,
  });

  return res.json({ id: submission.id });
}

// ─── Admin: submissions ─────────────────────────────────────────────────────

export async function getResaleSubmissions(req: Request, res: Response) {
  const status = typeof req.query.status === "string" ? req.query.status : undefined;

  const submissions = await prisma.resaleSubmission.findMany({
    where: status ? { status } : undefined,
    include: { listing: { select: { id: true, public_id: true, slug: true } } },
    orderBy: { created_at: "desc" },
  });

  return res.json(submissions);
}

export async function updateResaleSubmissionStatus(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);
  const { status, admin_notes } = req.body;

  if (!["pending", "reviewed", "rejected", "published"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const updated = await prisma.resaleSubmission.update({
    where: { id },
    data: { status, ...(admin_notes !== undefined ? { admin_notes } : {}) },
  });

  return res.json(updated);
}

export async function deleteResaleSubmission(req: Request, res: Response) {
  const id = parseInt(req.params.id, 10);

  const submission = await prisma.resaleSubmission.findUnique({
    where: { id },
    select: { photos: true, photos_meta: true },
  });
  if (!submission) {
    return res.status(404).json({ error: "Resale submission not found" });
  }

  const publicIds = getPublicIdsFromMediaCollection([submission.photos_meta, submission.photos]);

  await prisma.resaleSubmission.delete({ where: { id } });
  await deleteImages(publicIds);

  return res.json({ success: true });
}

// ─── Public: listings ───────────────────────────────────────────────────────

export async function getResaleListings(req: Request, res: Response) {
  const page = Math.max(parseInt(req.query.page as string) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 12, 1), 48);
  const offset = (page - 1) * limit;

  const keyword = String(req.query.keyword ?? req.query.q ?? "").trim();
  const bedrooms = (req.query.bedrooms as string) || null;
  const price_min = toNullableNumber(req.query.price_min);
  const price_max = toNullableNumber(req.query.price_max);

  const where: any = {
    status: "published",
    ...(keyword
      ? {
          OR: [
            { title: { contains: keyword, mode: "insensitive" as const } },
            { location: { contains: keyword, mode: "insensitive" as const } },
            { unit_type: { contains: keyword, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  let listings = await prisma.resaleListing.findMany({ where, orderBy: { id: "desc" } });

  if (bedrooms) {
    listings = listings.filter((listing) => bedsMatchesFilter(listing.beds, bedrooms));
  }

  if (price_min !== null || price_max !== null) {
    listings = listings.filter((listing) => {
      const numericPrice = Number(String(listing.price ?? "").replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(numericPrice) || numericPrice <= 0) return false;
      if (price_min !== null && numericPrice < price_min) return false;
      if (price_max !== null && numericPrice > price_max) return false;
      return true;
    });
  }

  const total = listings.length;
  const total_pages = Math.max(Math.ceil(total / limit), 1);

  if (page > total_pages && total > 0) {
    return res.status(400).json({ error: "Invalid page number" });
  }

  const paginated = listings.slice(offset, offset + limit);
  const transformed = paginated
    .map((listing) => mapListingCard(listing))
    .map((listing) => transformImagesToFullUrls(req, listing, ["main_image"]));

  return res.json({ listings: transformed, total_pages, current_page: page, total, limit });
}

export async function getResaleListingByIdentifier(req: Request, res: Response) {
  const listing = await resolveListing(req.params.identifier);
  if (!listing || listing.status !== "published") {
    return res.status(404).json({ error: "Not found" });
  }

  const mapped = mapListingDetail(listing);
  const withFullImage = transformImagesToFullUrls(req, mapped, ["main_image"]);
  withFullImage.gallery = transformGalleryToFullUrls(req, withFullImage.gallery, withFullImage.gallery_meta);
  return res.json(withFullImage);
}

// ─── Admin: listings ─────────────────────────────────────────────────────────

export async function getAdminResaleListings(req: Request, res: Response) {
  const listings = await prisma.resaleListing.findMany({ orderBy: { id: "desc" } });
  const transformed = listings
    .map((listing) => mapListingCard({ ...listing, status: listing.status }))
    .map((listing) => transformImagesToFullUrls(req, listing, ["main_image"]));
  return res.json(transformed);
}

export async function getAdminResaleListingById(req: Request, res: Response) {
  const listing = await prisma.resaleListing.findUnique({ where: { id: parseInt(req.params.id, 10) } });
  if (!listing) return res.status(404).json({ error: "Not found" });

  const mapped = mapListingDetail(listing);
  const withFullImage = transformImagesToFullUrls(req, mapped, ["main_image"]);
  withFullImage.gallery = transformGalleryToFullUrls(req, withFullImage.gallery, withFullImage.gallery_meta);
  return res.json(withFullImage);
}

export async function createResaleListing(req: Request, res: Response) {
  const {
    title, location, price, installment_value, remaining_amount, remaining_installments,
    delivery_time, description, gallery, gallery_meta, main_image_meta, beds, size,
    unit_type, status, slug, meta_title, meta_description, submission_id,
  } = req.body;

  const validationErrors = validateResaleListingInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const normalized = normalizeResaleListingPayload({
    title: title.trim(),
    location,
    price,
    installment_value,
    remaining_amount,
    remaining_installments,
    delivery_time,
    description,
    gallery,
    gallery_meta,
    main_image_meta,
    beds,
    size,
    unit_type,
    status,
    slug,
    meta_title,
    meta_description,
  });
  const finalSlug = await makeUniqueResaleSlug(generateSlug(normalized.slugCandidate));

  const resolvedSubmissionId = submission_id ? Number(submission_id) : null;

  const created = await prisma.$transaction(async (tx) => {
    const listing = await tx.resaleListing.create({
      data: {
        title: normalized.title,
        location: normalized.location,
        price: normalized.price,
        installment_value: normalized.installment_value,
        remaining_amount: normalized.remaining_amount,
        remaining_installments: normalized.remaining_installments,
        delivery_time: normalized.delivery_time,
        description: normalized.description,
        gallery: normalized.gallery,
        gallery_meta: normalized.gallery_meta,
        beds: normalized.beds,
        size: normalized.size,
        unit_type: normalized.unit_type,
        status: normalized.status,
        main_image: normalized.main_image,
        main_image_meta: normalized.main_image_meta,
        slug: finalSlug,
        meta_title: normalized.meta_title,
        meta_description: normalized.meta_description,
        submission_id: resolvedSubmissionId,
      },
    });

    if (resolvedSubmissionId) {
      await tx.resaleSubmission.update({
        where: { id: resolvedSubmissionId },
        data: { status: "published" },
      });
    }

    return listing;
  });

  return res.json({ id: created.id, public_id: created.public_id, slug: finalSlug });
}

export async function updateResaleListing(req: Request, res: Response) {
  const listingId = parseInt(req.params.id, 10);
  const {
    title, location, price, installment_value, remaining_amount, remaining_installments,
    delivery_time, description, gallery, gallery_meta, main_image_meta, beds, size,
    unit_type, status, slug, meta_title, meta_description,
  } = req.body;

  const validationErrors = validateResaleListingInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors[0] });
  }

  const normalized = normalizeResaleListingPayload(
    {
      title: title.trim(), location, price, installment_value, remaining_amount,
      remaining_installments, delivery_time, description, gallery, gallery_meta,
      main_image_meta, beds, size, unit_type, status, slug, meta_title, meta_description,
    },
    listingId,
  );
  const finalSlug = await makeUniqueResaleSlug(generateSlug(normalized.slugCandidate), listingId);

  const existingListing = await prisma.resaleListing.findUnique({
    where: { id: listingId },
    select: { main_image: true, main_image_meta: true, gallery: true, gallery_meta: true },
  });
  if (!existingListing) {
    return res.status(404).json({ error: "Resale listing not found" });
  }

  const previousPublicIds = getPublicIdsFromMediaCollection([
    existingListing.main_image_meta,
    existingListing.main_image,
    existingListing.gallery_meta,
    existingListing.gallery,
  ]);
  const nextPublicIds = getPublicIdsFromMediaCollection([
    normalized.main_image_meta,
    normalized.main_image,
    normalized.gallery_meta,
    normalized.gallery,
  ]);
  const publicIdsToDelete = previousPublicIds.filter((publicId) => !nextPublicIds.includes(publicId));

  await prisma.resaleListing.update({
    where: { id: listingId },
    data: {
      title: normalized.title,
      location: normalized.location,
      price: normalized.price,
      installment_value: normalized.installment_value,
      remaining_amount: normalized.remaining_amount,
      remaining_installments: normalized.remaining_installments,
      delivery_time: normalized.delivery_time,
      description: normalized.description,
      gallery: normalized.gallery,
      gallery_meta: normalized.gallery_meta,
      beds: normalized.beds,
      size: normalized.size,
      unit_type: normalized.unit_type,
      status: normalized.status,
      main_image: normalized.main_image,
      main_image_meta: normalized.main_image_meta,
      slug: finalSlug,
      meta_title: normalized.meta_title,
      meta_description: normalized.meta_description,
    },
  });

  await deleteImages(publicIdsToDelete);

  return res.json({ success: true });
}

export async function deleteResaleListing(req: Request, res: Response) {
  const listingId = parseInt(req.params.id, 10);
  if (Number.isNaN(listingId)) {
    return res.status(400).json({ error: "Invalid listing id" });
  }

  const listing = await prisma.resaleListing.findUnique({
    where: { id: listingId },
    select: { id: true, main_image: true, main_image_meta: true, gallery: true, gallery_meta: true },
  });
  if (!listing) {
    return res.status(404).json({ error: "Resale listing not found" });
  }

  const publicIds = getPublicIdsFromMediaCollection([
    listing.main_image_meta,
    listing.main_image,
    listing.gallery_meta,
    listing.gallery,
  ]);

  await prisma.$transaction(async (tx) => {
    await tx.lead.deleteMany({ where: { resale_listing_id: listingId } });
    await tx.resaleListing.delete({ where: { id: listingId } });
  });

  await deleteImages(publicIds);

  return res.json({ success: true, id: listingId });
}
