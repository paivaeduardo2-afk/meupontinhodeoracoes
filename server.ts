import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Handle favicon early to prevent 404 logs
  app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
  });

  // 2. API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Potinho de Orações API is running" });
  });

  if (process.env.NODE_ENV === "production") {
    // PRODUCTION MODE
    const distPath = path.resolve(__dirname, "dist");
    
    if (fs.existsSync(distPath)) {
      // Serve static assets from dist
      app.use(express.static(distPath, { index: false }));

      // SPA fallback: serve index.html for any non-file request
      app.get("*", (req, res) => {
        res.sendFile(path.resolve(distPath, "index.html"));
      });
    } else {
      console.warn("Production mode enabled but 'dist' folder not found. Please run 'npm run build' first.");
      app.get("*", (req, res) => {
        res.status(500).send("Application not built. Please run 'npm run build'.");
      });
    }
  } else {
    // DEVELOPMENT MODE
    // Use Vite's built-in SPA middleware which handles:
    // - Serving index.html with transformations
    // - Serving assets (/src/...)
    // - HMR (if enabled)
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        host: '0.0.0.0',
        port: 3000
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer().catch((err) => {
  console.error("Critical failure starting server:", err);
});
