import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeDatabase } from "./db/database.ts";
import authRoutes from "./routes/auth.ts";
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

  app.use(express.json());
  app.use("/uploads", express.static(uploadsDir));

  // API routes
  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/developers", developersRoutes);
  app.use("/api/destinations", destinationsRoutes);
  app.use("/api/blogs", blogsRoutes);
  app.use("/api/careers", careersRoutes);
  app.use("/api/property-types", propertyTypesRoutes);
  app.use("/api/amenities", amenitiesRoutes);
  app.use("/api/leads", leadsRoutes);
  app.use("/api/admin/stats", statsRoutes);
  app.use("/api/upload", uploadRoutes);

  app.use(handleMulterError);

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
