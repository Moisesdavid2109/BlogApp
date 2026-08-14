import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function App() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await fetch(`${API_URL}/posts`);
      if (!res.ok) throw new Error("Error al obtener las publicaciones");
      setPosts(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      const res = await fetch(`${API_URL}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) throw new Error("Error al crear la publicación");

      const post = await res.json();
      setPosts([post, ...posts]);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Blog Sencillo</h1>
        <p>Publica y comparte tus ideas con Docker, React y Express.</p>
      </header>

      <form onSubmit={handleSubmit} className="card">
        <h2>Nueva publicación</h2>
        <input
          type="text"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Contenido"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          required
        />
        <button type="submit">Publicar</button>
      </form>

      {error && <p className="error">{error}</p>}

      <section>
        <h2>Publicaciones</h2>
        {loading ? (
          <p>Cargando...</p>
        ) : posts.length === 0 ? (
          <p>Aún no hay publicaciones.</p>
        ) : (
          <ul className="posts">
            {posts.map((post) => (
              <li key={post.id} className="card">
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <small>{new Date(post.createdAt).toLocaleString("es")}</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
