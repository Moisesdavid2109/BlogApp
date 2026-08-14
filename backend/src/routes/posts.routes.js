const { Router } = require("express");
const postsStore = require("../data/posts.memory");

const router = Router();

router.get("/", (_req, res) => {
  res.json(postsStore.getAll());
});

router.post("/", (req, res) => {
  const { title, content } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: "title y content son obligatorios" });
  }

  const post = postsStore.create({ title, content });
  res.status(201).json(post);
});

module.exports = router;
