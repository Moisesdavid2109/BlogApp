const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "blog",
  password: process.env.DB_PASSWORD || "blog_password",
  database: process.env.DB_NAME || "blog",
});

const POST_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

async function seedIfEmpty() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM posts");
  if (rows[0].count > 0) return;

  await pool.query(
    `INSERT INTO posts (title, content) VALUES ($1, $2), ($3, $4)`,
    [
      "Bienvenido al Blog",
      "Este es el **primer post** del blog, persistido en PostgreSQL.\n\nEscribe con Markdown:\n\n- **negrita** y _cursiva_\n- Listas de ideas\n- `código en línea`\n\n> Escribir también es pensar.",
      "Docker y Docker Compose",
      "Frontend, backend y base de datos corren en **contenedores** orquestados:\n\n```yaml\nservices:\n  frontend:\n  backend:\n  database:\n```\n\nTodo persiste en un volumen de PostgreSQL.",
    ]
  );
}

async function initDb() {
  await pool.query(POST_TABLE_SQL);
  await seedIfEmpty();
}

async function checkConnection() {
  const { rows } = await pool.query("SELECT 1 AS ok");
  return rows[0].ok === 1;
}

module.exports = { pool, initDb, checkConnection };
