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

  // Vite middleware for development
  let vite: any;
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom", // Changed to custom to handle index.html manually
    });
    app.use(vite.middlewares);
  }

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Potinho de Orações API is running" });
  });

  // Prevent 404 for favicon.ico
  app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
  });

  // Serve the application
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      if (process.env.NODE_ENV === "production") {
        res.sendFile(path.resolve(__dirname, "dist", "index.html"));
      } else {
        // In development, read index.html and transform it through Vite
        let template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production" && vite) {
        vite.ssrFixStacktrace(e as Error);
      }
      next(e);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
