const { Router } = require("express");
const { pool } = require("../db");

const router = Router();

const FIELDS = `
  id,
  title,
  content,
  created_at AS "createdAt"
`;

router.get("/", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT ${FIELDS} FROM posts ORDER BY created_at DESC, id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error("Error al obtener publicaciones:", err);
    res.status(500).json({ error: "Error al obtener las publicaciones" });
  }
});

router.post("/", async (req, res) => {
  const { title, content } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: "title y content son obligatorios" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO posts (title, content)
       VALUES ($1, $2)
       RETURNING ${FIELDS}`,
      [title, content]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Error al crear publicación:", err);
    res.status(500).json({ error: "Error al crear la publicación" });
  }
});

module.exports = router;
