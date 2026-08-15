import { useEffect, useRef, useState } from "react";
import { marked } from "marked";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const DRAFT_KEY = "blogapp-draft";
const THEME_KEY = "blogapp-theme";

const MAX_TITLE = 80;
const MAX_CONTENT = 500;
const WORDS_PER_MINUTE = 200;

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

function readingTime(text) {
  return Math.max(1, Math.round(countWords(text) / WORDS_PER_MINUTE));
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(text) {
  return marked.parse(escapeHtml(text));
}

function PostCard({ post, onOpen }) {
  const contentRef = useRef(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (el) setTruncated(el.scrollHeight > el.clientHeight);
  }, [post.content]);

  return (
    <article className="post-card">
      <div className="post-topline">
        <span className="post-date">{timeAgo(post.createdAt)}</span>
      </div>
      <h3 className="post-title">
        <button type="button" className="post-title-btn" onClick={() => onOpen(post)}>
          {post.title}
        </button>
      </h3>
      <div
        className="post-content"
        ref={contentRef}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content) }}
      />
      <footer className="post-footer">
        <span>{countWords(post.content)} palabras</span>
        <span className="dot">·</span>
        <span>{readingTime(post.content)} min de lectura</span>
        {truncated && (
          <button type="button" className="read-more" onClick={() => onOpen(post)}>
            Ver más →
          </button>
        )}
      </footer>
    </article>
  );
}

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [preview, setPreview] = useState(false);
  const [zen, setZen] = useState(false);
  const [toolbar, setToolbar] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);

  const contentRef = useRef(null);
  const mirrorRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        if (draft.title) setTitle(draft.title);
        if (draft.content) setContent(draft.content);
      } catch {
        /* borrador corrupto, se ignora */
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content, savedAt: Date.now() }));
        setDraftSavedAt(Date.now());
      } else {
        localStorage.removeItem(DRAFT_KEY);
        setDraftSavedAt(null);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [title, content]);

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    document.body.style.overflow = zen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [zen]);

  useEffect(() => {
    if (!selectedPost) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedPost(null);
    };
    window.addEventListener("keydown", onKey);
    modalRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [selectedPost]);

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
      setPreview(false);
      localStorage.removeItem(DRAFT_KEY);
      setDraftSavedAt(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  /* --- Barra de formato flotante --- */

  function handleSelect() {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (end > start) {
      setToolbar(computeCaret(ta, end));
    } else {
      setToolbar(null);
    }
  }

  function computeCaret(ta, index) {
    const mirror = mirrorRef.current;
    if (!mirror) return { top: 12, left: 12 };

    mirror.style.width = `${ta.clientWidth}px`;
    mirror.textContent = ta.value.slice(0, index);
    mirror.innerHTML += `<span></span>`;

    const span = mirror.lastChild;
    const spanRect = span.getBoundingClientRect();
    const taRect = ta.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 24;

    const top = Math.max(4, spanRect.top - taRect.top - ta.scrollTop + lineHeight + 8);
    const left = Math.max(4, spanRect.left - taRect.left);

    return { top: Math.min(top, ta.clientHeight - 40), left };
  }

  function applyFormat(before, after, placeholder) {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || placeholder;
    const next = content.slice(0, start) + before + selected + after + content.slice(end);

    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
    setToolbar(null);
  }

  function applyList() {
    const ta = contentRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = content.slice(start, end) || "Elemento de lista";
    const lines = selected
      .split("\n")
      .map((line) => `- ${line}`)
      .join("\n");
    const next = content.slice(0, start) + lines + content.slice(end);

    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start, start + lines.length);
    });
    setToolbar(null);
  }

  const savedTime = draftSavedAt
    ? new Date(draftSavedAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className={`app${zen ? " app--zen" : ""}`}>
      <nav className="nav">
        <div className="nav-inner">
          <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
            BlogApp.
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
          <div className="composer-head">
            <h2 className="composer-title">{zen ? "Modo enfoque" : "Nueva entrada"}</h2>
            <div className="composer-actions">
              <span className="reading-hint">≈ {readingTime(content)} min de lectura</span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setZen((z) => !z)}
                title={zen ? "Salir del modo enfoque" : "Modo enfoque"}
                aria-label={zen ? "Salir del modo enfoque" : "Activar modo enfoque"}
              >
                {zen ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                )}
                <span>{zen ? "Salir" : "Enfocar"}</span>
              </button>
            </div>
          </div>

          <div className="composer-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={!preview}
              className={`tab-btn${!preview ? " tab-btn--active" : ""}`}
              onClick={() => setPreview(false)}
            >
              Escribir
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={preview}
              className={`tab-btn${preview ? " tab-btn--active" : ""}`}
              onClick={() => setPreview(true)}
            >
              Vista previa
            </button>
          </div>

          {preview ? (
            <div
              className="markdown-preview"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(content || "_Empieza a escribir para ver la vista previa…_") }}
            />
          ) : (
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

              <label className="field field--content">
                <span className="field-label">Contenido</span>

                <div className="composer-mirror" ref={mirrorRef} aria-hidden="true" />

                {toolbar && !preview && (
                  <div
                    className="format-bar"
                    style={{ top: toolbar.top, left: toolbar.left }}
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <button
                      type="button"
                      className="format-btn format-btn--bold"
                      title="Negrita"
                      onClick={() => applyFormat("**", "**", "texto en negrita")}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      className="format-btn format-btn--italic"
                      title="Cursiva"
                      onClick={() => applyFormat("_", "_", "texto en cursiva")}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      className="format-btn"
                      title="Lista"
                      onClick={applyList}
                    >
                      ••
                    </button>
                    <button
                      type="button"
                      className="format-btn"
                      title="Código"
                      onClick={() => applyFormat("`", "`", "código")}
                    >
                      {"</>"}
                    </button>
                  </div>
                )}

                <textarea
                  ref={contentRef}
                  maxLength={MAX_CONTENT}
                  rows={zen ? undefined : 6}
                  placeholder="Escribe despacio… usa **negrita**, _cursiva_, - listas y `código`"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onSelect={handleSelect}
                  onBlur={() => setTimeout(() => setToolbar(null), 150)}
                  required
                />
                <span className="counter">
                  {content.length}/{MAX_CONTENT}
                </span>
              </label>

              <button type="submit" className="btn" disabled={submitting}>
                {submitting ? "Publicando…" : "Publicar entrada"}
              </button>
            </form>
          )}

          <div className="composer-status">
            {savedTime && (
              <span className="status-saved">
                <svg
                  viewBox="0 0 24 24"
                  width="13"
                  height="13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Borrador guardado · {savedTime}
              </span>
            )}
            <span className="status-hint">Soporta **negrita**, _cursiva_, - listas y `código`</span>
          </div>
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
            <div className="post-grid" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <div className="skeleton-card" key={i}>
                  <div className="skeleton skeleton--chip" />
                  <div className="skeleton skeleton--title" />
                  <div className="skeleton skeleton--line" />
                  <div className="skeleton skeleton--line" />
                  <div className="skeleton skeleton--line skeleton--short" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="empty">
              <h3>Aún no hay nada escrito</h3>
              <p>Empieza tú: publica la primera entrada de la bitácora.</p>
            </div>
          ) : (
            <div className="post-grid">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onOpen={setSelectedPost} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>
          BlogApp. Hecho con React, Express y Docker —{" "}
          {new Date().getFullYear()}
        </p>
      </footer>

      {selectedPost && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedPost(null)}
        >
          <article
            className="modal"
            ref={modalRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={selectedPost.title}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="modal-head">
              <span className="post-date">{timeAgo(selectedPost.createdAt)}</span>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedPost(null)}
                aria-label="Cerrar nota"
              >
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </header>
            <h2 className="modal-title">{selectedPost.title}</h2>
            <div
              className="modal-content"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(selectedPost.content) }}
            />
            <footer className="modal-footer">
              <span>{countWords(selectedPost.content)} palabras</span>
              <span className="dot">·</span>
              <span>{readingTime(selectedPost.content)} min de lectura</span>
            </footer>
          </article>
        </div>
      )}
    </div>
  );
}
