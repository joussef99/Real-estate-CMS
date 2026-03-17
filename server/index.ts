import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeDatabase, db } from "./db/database.ts";
import authRoutes from "./routes/auth.ts";
import rateLimit from "express-rate-limit";
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
import { uploadsDir, handleMulterError } from "./utils/uploads.ts";

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  initializeDatabase();

  const app = express();

  // Trust reverse-proxy headers so req.protocol is 'https' in production
  app.set("trust proxy", 1);

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

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
  app.use("/api/admin/projects", projectsRoutes);
  app.use("/api/developers", developersRoutes);
  app.use("/api/destinations", destinationsRoutes);
  app.use("/api/blogs", blogsRoutes);
  app.use("/api/careers", careersRoutes);
  app.use("/api/property-types", propertyTypesRoutes);
  app.use("/api/amenities", amenitiesRoutes);
  app.use("/api/leads", leadsRoutes);
  app.use("/api/admin/stats", statsRoutes);
  app.use("/api/upload", uploadRoutes);

  // Newsletter subscriber endpoint
  app.post("/api/newsletter", (req, res) => {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "A valid email address is required." });
    }
    try {
      db.prepare(
        "INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)"
      ).run(email);
      res.json({ success: true, message: "You have been subscribed." });
    } catch (err: any) {
      res.status(500).json({ error: "Could not save subscription." });
    }
  });

  // Ensure unknown API routes always return JSON, never SPA HTML.
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  // SEO endpoints
  app.get('/sitemap.xml', async (req, res) => {
    const hostname = `${req.protocol}://${req.get('host')}`;

    const projects = db.prepare('SELECT id, slug FROM projects').all() as any[];
    const blogs = db.prepare('SELECT id, slug FROM blogs').all() as any[];
    const destinations = db.prepare('SELECT id, slug FROM destinations').all() as any[];

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

  // Global JSON error handler for all backend routes
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Internal Server Error' });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    process.stdout.write(`Server running on port ${PORT}\n`);
  });
}

startServer();
