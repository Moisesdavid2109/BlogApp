const express = require("express");
const cors = require("cors");

const postsRouter = require("./routes/posts.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "blog-backend" });
});

app.use("/api/posts", postsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

module.exports = app;
