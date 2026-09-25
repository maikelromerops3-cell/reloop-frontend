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

// Traduce el estado del artículo (tal como lo escribe el vendedor) al valor que entiende
// Schema.org, para los datos estructurados de producto. Si no coincide con nada, se usa
// UsedCondition por defecto — todo en Ropelin es de segunda mano.
const CONDITION_SCHEMA = {
  "Nuevo con etiquetas": "https://schema.org/NewCondition",
  "Como nuevo": "https://schema.org/NewCondition",
  "Muy bueno": "https://schema.org/UsedCondition",
  "Bueno": "https://schema.org/UsedCondition",
  "Aceptable": "https://schema.org/UsedCondition",
};

function escapeHtml(str = "") {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function withMeta(html, { title, description, image, url, jsonLd }) {
  let out = html;
  out = out.replace(/<title>.*?<\/title>/, `<title>${escapeHtml(title)}</title>`);
  out = out.replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="${escapeHtml(url)}" />`);
  out = out.replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${escapeHtml(title)}" />`);
  out = out.replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${escapeHtml(description)}" />`);
  out = out.replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="${escapeHtml(url)}" />`);
  out = out.replace(/<meta name="twitter:title" content=".*?" \/>/, `<meta name="twitter:title" content="${escapeHtml(title)}" />`);
  out = out.replace(/<meta name="twitter:description" content=".*?" \/>/, `<meta name="twitter:description" content="${escapeHtml(description)}" />`);
  if (image) {
    out = out.replace("</head>", `<meta property="og:image" content="${escapeHtml(image)}" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="${escapeHtml(image)}" /></head>`);
  }
  if (jsonLd) {
    out = out.replace("</head>", `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head>`);
  }
  return out;
}

app.get("/item/:id", async (req, res, next) => {
  const isBot = BOT_UA_PATTERN.test(req.headers["user-agent"] || "");
  if (!isBot) return next(); // personas reales: seguimos hacia la app normal

  try {
    const r = await fetch(`${API_URL}/items/${req.params.id}`);
    // Si el artículo no existe, se lo decimos claramente a Google con un 404 de verdad,
    // en vez de servirle la portada con un 200 como si no pasara nada — si no, con el
    // tiempo acumula miles de páginas "fantasma" indexadas que no llevan a ningún sitio.
    if (!r.ok) return res.status(404).set("Content-Type", "text/html").send(indexHtml);
    const item = await r.json();
    const html = withMeta(indexHtml, {
      title: `${item.title} — ${item.price}€ | Ropelin`,
      description: (item.description || "Segunda mano en Ropelin").slice(0, 200),
      image: item.images?.[0] || null,
      url: `${SITE_URL}/item/${item.id}`,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: item.title,
        description: (item.description || "").slice(0, 500),
        image: item.images || [],
        offers: {
          "@type": "Offer",
          price: item.price,
          priceCurrency: "EUR",
          availability: item.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
          url: `${SITE_URL}/item/${item.id}`,
        },
        ...(item.condition ? { itemCondition: CONDITION_SCHEMA[item.condition] || "https://schema.org/UsedCondition" } : {}),
      },
    });
    res.set("Content-Type", "text/html").send(html);
  } catch {
    next();
  }
});

// Páginas legales públicas de verdad (no dependen de abrir la app/React): esto es lo que
// hace falta para poder poner un enlace válido en Google Play Console, en el pie de página
// de emails, etc. — una URL que cualquiera pueda abrir sin instalar ni cargar JS.
const privacidadHtml = fs.readFileSync(path.join(__dirname, "legal", "privacidad.html"), "utf8");
const terminosHtml = fs.readFileSync(path.join(__dirname, "legal", "terminos.html"), "utf8");
const cookiesHtml = fs.readFileSync(path.join(__dirname, "legal", "cookies.html"), "utf8");
const comoUsarHtml = fs.readFileSync(path.join(__dirname, "legal", "como-usar.html"), "utf8");
app.get("/sitemap.xml", async (req, res) => {
  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/privacidad`, changefreq: "monthly", priority: "0.3" },
    { loc: `${SITE_URL}/terminos`, changefreq: "monthly", priority: "0.3" },
    { loc: `${SITE_URL}/cookies`, changefreq: "monthly", priority: "0.3" },
    { loc: `${SITE_URL}/como-usar`, changefreq: "monthly", priority: "0.4" },
  ];
  let items = [];
  try {
    const r = await fetch(`${API_URL}/items/sitemap-list`);
    if (r.ok) items = await r.json();
  } catch {
    // si el backend no responde, servimos igualmente el sitemap con las páginas fijas
  }
  const itemUrls = items.map(
    (it) => `  <url>\n    <loc>${SITE_URL}/item/${it.id}</loc>\n    <lastmod>${new Date(it.createdAt).toISOString().slice(0, 10)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
  );
  const staticXml = staticUrls.map(
    (u) => `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
  );
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticXml, ...itemUrls].join("\n")}\n</urlset>`;
  res.set("Content-Type", "application/xml").send(xml);
});

app.get("/privacidad", (req, res) => res.set("Content-Type", "text/html").send(privacidadHtml));
app.get("/terminos", (req, res) => res.set("Content-Type", "text/html").send(terminosHtml));
app.get("/cookies", (req, res) => res.set("Content-Type", "text/html").send(cookiesHtml));
app.get("/como-usar", (req, res) => res.set("Content-Type", "text/html").send(comoUsarHtml));

app.use(express.static(DIST_DIR));

// Cualquier otra ruta (navegación del lado del cliente): servimos la app y que React Router decida
app.get("*", (req, res) => {
  res.set("Content-Type", "text/html").send(indexHtml);
});

app.listen(PORT, () => console.log(`Ropelin frontend escuchando en puerto ${PORT}`));
