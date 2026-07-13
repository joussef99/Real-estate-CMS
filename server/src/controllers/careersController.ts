import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { translateCareerToEgyptianArabic } from "../services/translationService.ts";

export async function getCareers(req: Request, res: Response) {
  const careers = await prisma.career.findMany({ orderBy: { id: "desc" } });
  return res.json(careers);
}

export async function createCareer(req: Request, res: Response) {
  const { title, location, type, description, requirements, apply_link } = req.body;
  const translation = await translateCareerToEgyptianArabic({ description, requirements });
  const career = await prisma.career.create({
    data: {
      title,
      location,
      type,
      description,
      description_ar: translation?.description_ar ?? null,
      requirements,
      requirements_ar: translation?.requirements_ar ?? null,
      apply_link: apply_link || null,
    },
  });
  return res.json({ id: career.id });
}

export async function updateCareer(req: Request, res: Response) {
  const { title, location, type, description, requirements, apply_link } = req.body;
  const careerId = Number(req.params.id);
  const existing = await prisma.career.findUnique({
    where: { id: careerId },
    select: { description: true, description_ar: true, requirements: true, requirements_ar: true },
  });

  const sourceChanged = existing?.description !== description || existing?.requirements !== requirements;
  const translation = sourceChanged ? await translateCareerToEgyptianArabic({ description, requirements }) : null;

  await prisma.career.update({
    where: { id: careerId },
    data: {
      title,
      location,
      type,
      description,
      description_ar: sourceChanged ? translation?.description_ar ?? existing?.description_ar ?? null : existing?.description_ar ?? null,
      requirements,
      requirements_ar: sourceChanged ? translation?.requirements_ar ?? existing?.requirements_ar ?? null : existing?.requirements_ar ?? null,
      apply_link: apply_link || null,
    },
  });
  return res.json({ success: true });
}

export async function deleteCareer(req: Request, res: Response) {
  await prisma.career.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true });
}
