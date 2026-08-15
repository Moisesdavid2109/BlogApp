const express = require("express");
const cors = require("cors");

const postsRouter = require("./routes/posts.routes");
const { checkConnection } = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    await checkConnection();
    res.json({ status: "ok", database: "connected", service: "blog-backend" });
  } catch {
    res.status(503).json({ status: "degraded", database: "disconnected", service: "blog-backend" });
  }
});

app.use("/api/posts", postsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

module.exports = app;
