require("dotenv").config();

const app = require("./app");
const { initDb } = require("./db");

const PORT = process.env.PORT || 3000;

async function start() {
  await initDb();
  console.log("Conexión a PostgreSQL establecida y esquema listo");

  app.listen(PORT, () => {
    console.log(`API del blog corriendo en http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("No se pudo conectar a la base de datos:", err.message);
  process.exit(1);
});
