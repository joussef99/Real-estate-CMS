import { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { generateSlug } from "../utils/slug.ts";
import { transformImagesToFullUrls } from "../utils/imageUrl.ts";

const makeUniqueBlogSlug = async (baseSlug: string, currentId?: number): Promise<string> => {
  let slug = baseSlug;
  let count = 1;

  while (true) {
    const existing = await prisma.blog.findUnique({ where: { slug } });
    if (!existing || (currentId && existing.id === currentId)) break;
    slug = `${baseSlug}-${count++}`;
  }

  return slug;
};

export async function getBlogs(req: Request, res: Response) {
  const limit = parseInt(req.query.limit as string) || 0;
  const page = parseInt(req.query.page as string) || 1;

  if (limit <= 0 && !req.query.page) {
    const blogs = await prisma.blog.findMany({
      select: { id: true, title: true, image: true, category: true, author: true, created_at: true, slug: true },
      orderBy: { created_at: "desc" },
    });
    const transformedBlogs = (blogs as any[]).map((b) => transformImagesToFullUrls(req, b, ["image"]));
    return res.json(transformedBlogs);
  }

  const total = await prisma.blog.count();
  const total_pages = Math.max(Math.ceil(total / Math.max(limit, 1)), 1);
  const offset = (Math.max(page, 1) - 1) * Math.max(limit, 1);

  const blogs = await prisma.blog.findMany({
    select: { id: true, title: true, image: true, category: true, author: true, created_at: true, slug: true },
    orderBy: { created_at: "desc" },
    ...(limit > 0 ? { take: limit, skip: offset } : {}),
  });

  const transformedBlogs = (blogs as any[]).map((b) => transformImagesToFullUrls(req, b, ["image"]));

  return res.json({
    blogs: transformedBlogs,
    total,
    total_pages,
    current_page: Math.max(page, 1),
    limit: limit || total,
  });
}

export async function getBlogByIdentifier(req: Request, res: Response) {
  const identifier = req.params.identifier;

  if (!identifier) {
    return res.status(404).json({ error: "Not found" });
  }

  let blog;
  if (/^\d+$/.test(identifier)) {
    blog = await prisma.blog.findUnique({ where: { id: parseInt(identifier, 10) } });
  }

  if (!blog) {
    blog = await prisma.blog.findUnique({ where: { slug: identifier } });
  }

  if (!blog) return res.status(404).json({ error: "Not found" });

  const blogWithImages = transformImagesToFullUrls(req, blog as any, ["image"]);
  return res.json(blogWithImages);
}

export async function createBlog(req: Request, res: Response) {
  const { title, content, image, category, author, slug, meta_title, meta_description } = req.body;

  const baseSlugCandidate = (slug && slug.trim()) || title;
  const baseSlug = generateSlug(baseSlugCandidate || `blog-${Date.now()}`);
  const finalSlug = await makeUniqueBlogSlug(baseSlug);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || (content ? content.substring(0, 160) : `Read about ${title.toLowerCase()}.`);

  const created = await prisma.blog.create({
    data: {
      title,
      content,
      image,
      category,
      author,
      slug: finalSlug,
      meta_title: finalMetaTitle,
      meta_description: finalMetaDescription,
    },
  });
  return res.json({ id: created.id, slug: finalSlug });
}

export async function updateBlog(req: Request, res: Response) {
  const { title, content, image, category, author, slug, meta_title, meta_description } = req.body;
  const blogId = parseInt(req.params.id, 10);

  const baseSlugCandidate = (slug && slug.trim()) || title;
  const baseSlug = generateSlug(baseSlugCandidate || `blog-${Date.now()}`);
  const finalSlug = await makeUniqueBlogSlug(baseSlug, blogId);
  const finalMetaTitle = meta_title || title;
  const finalMetaDescription = meta_description || (content ? content.substring(0, 160) : `Read about ${title.toLowerCase()}.`);

  await prisma.blog.update({
    where: { id: blogId },
    data: {
      title,
      content,
      image,
      category,
      author,
      slug: finalSlug,
      meta_title: finalMetaTitle,
      meta_description: finalMetaDescription,
    },
  });
  return res.json({ success: true });
}

export async function deleteBlog(req: Request, res: Response) {
  await prisma.blog.delete({ where: { id: Number(req.params.id) } });
  return res.json({ success: true });
}
