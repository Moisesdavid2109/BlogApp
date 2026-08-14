const posts = [
  {
    id: 1,
    title: "Bienvenido al Blog",
    content: "Este es el primer post del blog sencillo construido con Node.js y Express.",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Docker y Docker Compose",
    content: "Próximamente este backend se conectará a PostgreSQL mediante Docker Compose.",
    createdAt: new Date().toISOString(),
  },
];

let nextId = posts.length + 1;

function getAll() {
  return posts;
}

function create({ title, content }) {
  const post = {
    id: nextId++,
    title,
    content,
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  return post;
}

module.exports = { getAll, create };
