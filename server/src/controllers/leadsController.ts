import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { notifyAdmin } from "../services/notificationService.ts";

export async function createLead(req: Request, res: Response) {
  const { name, email, phone, message, project_id, resale_listing_id } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: "Name, email, and message are required" });
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      phone: phone || null,
      message,
      project_id: project_id ? Number(project_id) : null,
      resale_listing_id: resale_listing_id ? Number(resale_listing_id) : null,
    },
  });

  notifyAdmin({
    subject: `New lead: ${name}`,
    html: `
      <h2>New lead received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "(not provided)"}</p>
      <p><strong>Message:</strong> ${message}</p>
    `,
  });

  return res.json({ id: lead.id });
}

export async function getLeads(req: Request, res: Response) {
  const leads = await prisma.lead.findMany({
    include: {
      project: {
        select: { name: true },
      },
      resaleListing: {
        select: { title: true, slug: true },
      },
    },
    orderBy: { created_at: "desc" },
  });

  const response = leads.map((lead) => ({
    ...lead,
    project_name: lead.project?.name ?? null,
    resale_listing_title: lead.resaleListing?.title ?? null,
    resale_listing_slug: lead.resaleListing?.slug ?? null,
  }));

  return res.json(response);
}

export async function deleteLead(req: Request, res: Response) {
  await prisma.lead.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true });
}
