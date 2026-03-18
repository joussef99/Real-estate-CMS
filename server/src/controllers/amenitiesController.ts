import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export async function getAmenities(req: Request, res: Response) {
  const amenities = await prisma.amenity.findMany({
    orderBy: { name: "asc" },
  });
  return res.json(amenities);
}

export async function createAmenity(req: Request, res: Response) {
  const { name } = req.body;
  const created = await prisma.amenity.create({ data: { name } });
  return res.json({ id: created.id });
}

export async function updateAmenity(req: Request, res: Response) {
  const { name } = req.body;
  await prisma.amenity.update({
    where: { id: Number(req.params.id) },
    data: { name },
  });
  return res.json({ success: true });
}

export async function deleteAmenity(req: Request, res: Response) {
  await prisma.amenity.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true });
}
