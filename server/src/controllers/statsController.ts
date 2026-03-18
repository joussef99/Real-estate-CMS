import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";

export async function getStats(req: Request, res: Response) {
  const [projects, developers, destinations, blogs] = await Promise.all([
    prisma.project.count(),
    prisma.developer.count(),
    prisma.destination.count(),
    prisma.blog.count(),
  ]);

  const stats = {
    projects,
    developers,
    destinations,
    blogs,
  };

  return res.json(stats);
}
