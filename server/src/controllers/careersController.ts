import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export async function getCareers(req: Request, res: Response) {
  const careers = await prisma.career.findMany({ orderBy: { id: "desc" } });
  return res.json(careers);
}

export async function createCareer(req: Request, res: Response) {
  const { title, location, type, description, requirements, apply_link } = req.body;
  const career = await prisma.career.create({
    data: { title, location, type, description, requirements, apply_link: apply_link || null },
  });
  return res.json({ id: career.id });
}

export async function updateCareer(req: Request, res: Response) {
  const { title, location, type, description, requirements, apply_link } = req.body;
  await prisma.career.update({
    where: { id: Number(req.params.id) },
    data: { title, location, type, description, requirements, apply_link: apply_link || null },
  });
  return res.json({ success: true });
}

export async function deleteCareer(req: Request, res: Response) {
  await prisma.career.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true });
}
