import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.ts";
import { authenticate, requireAdmin } from "./middleware/auth.ts";
import projectsRoutes from "./routes/projects.ts";
import developersRoutes from "./routes/developers.ts";
import destinationsRoutes from "./routes/destinations.ts";
import blogsRoutes from "./routes/blogs.ts";
import careersRoutes from "./routes/careers.ts";
import propertyTypesRoutes from "./routes/property-types.ts";
import amenitiesRoutes from "./routes/amenities.ts";
import leadsRoutes from "./routes/leads.ts";
import statsRoutes from "./routes/stats.ts";
import uploadRoutes from "./routes/uploads.ts";
import mediaRoutes from "./routes/media.ts";
import { handleMulterError } from "./utils/uploads.ts";
import { prisma, assertDatabaseConnection } from "./lib/prisma.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { validateEnv } from "./lib/env-validation.ts";
import bcrypt from "bcryptjs";

// Validate environment variables early before any other code runs
const env = validateEnv();
const PORT = env.port;

function getAllowedCorsOrigins() {
  return (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function startServer() {
  await assertDatabaseConnection();

  const adminExists = await prisma.user.findUnique({ where: { username: "admin" } });
  if (!adminExists) {
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD || "admin123";
    if (initialPassword === "admin123") {
      process.stderr.write(
        "[WARN] Default admin password 'admin123' is in use. " +
          "Set ADMIN_INITIAL_PASSWORD env variable before first run, or change it via the admin panel.\n",
      );
    }
    const hashedPassword = bcrypt.hashSync(initialPassword, 10);
    await prisma.user.create({ data: { username: "admin", password: hashedPassword } });
  }

  const app = express();

  // Trust reverse-proxy headers so req.protocol is 'https' in production
  app.set("trust proxy", 1);

  // Enable CORS for frontend origin
  const corsOrigin = getAllowedCorsOrigins();
  app.use(cors({
    origin(origin, callback) {
      if (!origin || corsOrigin.length === 0 || corsOrigin.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }));

  process.stdout.write(
    `[CORS] Allowed origins: ${corsOrigin.length ? corsOrigin.join(", ") : "all origins (CORS_ORIGIN not set)"}\n`,
  );

  app.use(express.json());

  // Rate limiting — login endpoint
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again in 15 minutes." },
  });
  app.use("/api/auth/login", loginLimiter);

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", authRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/admin/projects", authenticate, requireAdmin, projectsRoutes);
  // Backward-compatible alias for clients using /properties endpoints
  app.use("/api/properties", projectsRoutes);
  app.use("/api/admin/properties", authenticate, requireAdmin, projectsRoutes);
  app.use("/properties", projectsRoutes);
  app.use("/admin/properties", projectsRoutes);
  app.use("/api/developers", developersRoutes);
  app.use("/api/destinations", destinationsRoutes);
  app.use("/api/blogs", blogsRoutes);
  app.use("/api/careers", careersRoutes);
  app.use("/api/property-types", propertyTypesRoutes);
  app.use("/api/amenities", amenitiesRoutes);
  app.use("/api/leads", leadsRoutes);
  app.use("/api/admin/stats", statsRoutes);
  app.use("/api/upload", uploadRoutes);
  app.use("/api/media", mediaRoutes);
  app.use("/media", mediaRoutes);

  // Newsletter subscriber endpoint
  app.post("/api/newsletter", async (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    try {
      await prisma.newsletterSubscriber.upsert({
        where: { email },
        update: {},
        create: { email },
      });
      res.json({ success: true, message: "You have been subscribed." });
    } catch (err: any) {
      res.status(500).json({ error: "Could not save subscription." });
    }
  });

  // Get newsletter subscribers (admin only)
  app.get("/api/newsletter", authenticate, requireAdmin, async (req, res) => {
    try {
      const subscribers = await prisma.newsletterSubscriber.findMany({
        select: { id: true, email: true, created_at: true },
        orderBy: { created_at: "desc" },
      });
      res.json(subscribers);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Could not fetch subscribers." });
    }
  });

  // Delete newsletter subscriber (admin only)
  app.delete("/api/newsletter/:id", authenticate, requireAdmin, async (req, res) => {
    try {
      await prisma.newsletterSubscriber.delete({ where: { id: Number(req.params.id) } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: "Could not delete subscriber." });
    }
  });

  // Ensure unknown API routes always return JSON, never SPA HTML.
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });
  // Health check endpoint (useful for Railway)
  app.get("/health", (req, res) => {
    res.json({ status: "ok", environment: env.nodeEnv, timestamp: new Date().toISOString() });
  });
  // SEO endpoints
  app.get('/sitemap.xml', async (req, res) => {
    const hostname = `${req.protocol}://${req.get('host')}`;

    const [projects, blogs, destinations] = await Promise.all([
      prisma.project.findMany({ select: { id: true, slug: true } }),
      prisma.blog.findMany({ select: { id: true, slug: true } }),
      prisma.destination.findMany({ select: { id: true, slug: true } }),
    ]);

    const staticUrls = [
      '/',
      '/projects',
      '/blogs',
      '/about',
      '/contact',
      '/careers',
      '/developers',
      '/destinations'
    ];

    const urls = [
      ...staticUrls.map(path => ({ url: `${hostname}${path}`, priority: 0.8 })),
      ...projects.map(p => ({ url: `${hostname}/projects/${p.slug || p.id}`, priority: 0.9 })),
      ...blogs.map(b => ({ url: `${hostname}/blogs/${b.slug || b.id}`, priority: 0.8 })),
      ...destinations.map(d => ({ url: `${hostname}/destinations/${d.slug || d.id}`, priority: 0.8 }))
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.url}</loc><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;

    res.type('application/xml').send(xml);
  });

  app.get('/robots.txt', (req, res) => {
    const hostname = `${req.protocol}://${req.get('host')}`;
    res.type('text/plain').send(`User-agent: *\nAllow: /\nSitemap: ${hostname}/sitemap.xml\n`);
  });

  app.use(handleMulterError);

  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    process.stdout.write(`[OK] Server running on port ${PORT}\n`);
    process.stdout.write(`[OK] Database: Prisma client initialized\n`);
    process.stdout.write(`[OK] Admin user: Ready\n`);
  });
}

startServer().catch((err) => {
  process.stderr.write(`[FATAL] Server startup failed: ${err.message}\n`);
  process.stderr.write(`Stack: ${err.stack}\n`);
  process.exit(1);
});
