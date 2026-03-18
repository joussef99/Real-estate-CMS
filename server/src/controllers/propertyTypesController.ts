import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export async function getPropertyTypes(req: Request, res: Response) {
  const propertyTypes = await prisma.propertyType.findMany({
    orderBy: { name: "asc" },
  });
  return res.json(propertyTypes);
}

export async function createPropertyType(req: Request, res: Response) {
  const { name } = req.body;
  const created = await prisma.propertyType.create({ data: { name } });
  return res.json({ id: created.id });
}

export async function updatePropertyType(req: Request, res: Response) {
  const { name } = req.body;
  await prisma.propertyType.update({
    where: { id: Number(req.params.id) },
    data: { name },
  });
  return res.json({ success: true });
}

export async function deletePropertyType(req: Request, res: Response) {
  await prisma.propertyType.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true });
}
