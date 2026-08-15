import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const MAX_TITLE = 80;
const MAX_CONTENT = 500;

function timeAgo(iso) {
  const date = new Date(iso);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "ahora mismo";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} día${days === 1 ? "" : "s"}`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem("pulso-theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("pulso-theme", theme);
  }, [theme]);

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error("No pudimos cargar las publicaciones");
      setPosts(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) throw new Error("No pudimos publicar tu entrada");
      const post = await res.json();
      setPosts([post, ...posts]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-inner">
          <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
            Pulso.
          </a>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Cambiar tema"
            title={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
          >
            {theme === "dark" ? (
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <header className="hero">
        <div className="container">
          <p className="kicker">Bitácora · React · Express · Docker</p>
          <h1 className="hero-title">
            Escribir también es <em>pensar</em>.
          </h1>
          <p className="hero-sub">
            Un blog pequeño, personal y sin distracciones.
          </p>
        </div>
      </header>

      <main className="container">
        <section className="composer" aria-label="Nueva publicación">
          <h2 className="composer-title">Nueva entrada</h2>
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span className="field-label">Título</span>
              <input
                type="text"
                maxLength={MAX_TITLE}
                placeholder="Un buen título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <span className="counter">{title.length}/{MAX_TITLE}</span>
            </label>
            <label className="field">
              <span className="field-label">Contenido</span>
              <textarea
                maxLength={MAX_CONTENT}
                rows={5}
                placeholder="Escribe despacio…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
              <span className="counter">{content.length}/{MAX_CONTENT}</span>
            </label>
            <button type="submit" className="btn" disabled={submitting}>
              {submitting ? "Publicando…" : "Publicar entrada"}
            </button>
          </form>
        </section>

        {error && (
          <div className="toast" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Cerrar">
              Cerrar
            </button>
          </div>
        )}

        <section className="posts" aria-label="Publicaciones">
          <header className="section-head">
            <h2>Publicaciones</h2>
            {!loading && <span className="count">{posts.length}</span>}
          </header>

          {loading ? (
            <div className="skeletons" aria-hidden="true">
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--line" />
              <div className="skeleton skeleton--title" />
              <div className="skeleton skeleton--line" />
            </div>
          ) : posts.length === 0 ? (
            <div className="empty">
              <h3>Aún no hay nada escrito</h3>
              <p>Empieza tú: publica la primera entrada de la bitácora.</p>
            </div>
          ) : (
            <ul className="post-list">
              {posts.map((post) => (
                <li key={post.id} className="post-item">
                  <div className="post-topline">
                    <span>{timeAgo(post.createdAt)}</span>
                    <span className="dot">·</span>
                    <span>{countWords(post.content)} palabras</span>
                  </div>
                  <h3 className="post-title">{post.title}</h3>
                  <p className="post-content">{post.content}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          Pulso. Hecho con React, Express y Docker —{" "}
          {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
