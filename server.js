// Servidor de producción del frontend. Sustituye al paquete "serve" plano porque necesitamos
// una cosa que "serve" no puede hacer: cuando el robot de WhatsApp/Facebook/Twitter/Telegram
// pide la vista previa de un enlace a un artículo, le servimos una versión mínima de HTML con
// las etiquetas og:title/og:image/og:description de ESE artículo en concreto (foto, título,
// precio), en vez de las genéricas de la portada — porque esos robots no ejecutan JavaScript,
// así que si dejáramos que cargue la app de React normal, no verían nada específico del artículo.
// Para cualquier persona real (o cualquier ruta que no sea /item/:id), se sirve la app tal cual.
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const DIST_DIR = path.join(__dirname, "dist");
const API_URL = process.env.VITE_API_URL || "http://localhost:4000/api";
const SITE_URL = process.env.VITE_SITE_URL || "https://ropelin.com";

const indexHtml = fs.readFileSync(path.join(DIST_DIR, "index.html"), "utf8");

// Patrón de user-agents de robots que generan vistas previas de enlaces (no ejecutan JS)
const BOT_UA_PATTERN = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|Slackbot|LinkedInBot|Discordbot|SkypeUriPreview|Pinterest|redditbot|vkShare|Googlebot/i;

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function withMeta(html, { title, description, image, url }) {
  let out = html;
  out = out.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  out = out.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  out = out.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  out = out.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  out = out.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  out = out.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  if (image) {
    out = out.replace("</head>", `<meta property="og:image" content="${escapeHtml(image)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="${escapeHtml(image)}" /></head>`);
  }
  return out;
}

app.get("/item/:id", async (req, res, next) => {
  const isBot = BOT_UA_PATTERN.test(req.headers["user-agent"] || "");
  if (!isBot) return next(); // personas reales: seguimos hacia la app normal

  try {
    const r = await fetch(`${API_URL}/items/${req.params.id}`);
    if (!r.ok) return next();
    const item = await r.json();
    const html = withMeta(indexHtml, {
      title: `${item.title} — ${item.price}€ | Ropelin`,
      description: (item.description || "Segunda mano en Ropelin").slice(0, 200),
      image: item.images?.[0] || null,
      url: `${SITE_URL}/item/${item.id}`,
    });
    res.set("Content-Type", "text/html").send(html);
  } catch {
    next();
  }
});

app.use(express.static(DIST_DIR));

// Cualquier otra ruta (navegación del lado del cliente): servimos la app y que React Router decida
app.get("*", (req, res) => {
  res.set("Content-Type", "text/html").send(indexHtml);
});

app.listen(PORT, () => console.log(`Ropelin frontend escuchando en puerto ${PORT}`));
