// Pide a Cloudinary una versión del tamaño justo en vez del original.
// Las fotos se guardaban tal cual (2–8 MB, hasta 48 MP del iPhone): la home descargaba decenas
// de megas y iOS Safari se quedaba sin memoria para decodificarlas → aparecía el icono "?".
//  - f_auto: WebP/AVIF si el navegador lo soporta (y convierte HEIC)
//  - q_auto: calidad ajustada automáticamente
//  - c_limit,w_N: nunca más ancha que N px (sin ampliar las pequeñas)
//  - dpr: el doble en pantallas retina, con tope en 2 (3x no aporta nada visible en fotos)
const DPR = typeof window !== "undefined" ? Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1))) : 2;

export function cld(url, width = 600) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com") || !url.includes("/image/upload/")) return url;
  const [base, rest] = url.split("/image/upload/");
  // si ya lleva transformación (primer segmento con "_" y "," o f_/q_/w_), no la duplicamos
  const first = rest.split("/")[0];
  if (/^(?:[a-z]{1,3}_[^/]+)$/.test(first) && !/^v\d+$/.test(first)) return url;
  const w = Math.round(width * DPR);
  return `${base}/image/upload/f_auto,q_auto,c_limit,w_${w}/${rest}`;
}

// Tamaños estándar para no repetir números por toda la app
export const IMG = {
  thumb: 120,   // miniaturas de listas, chats, sugerencias
  avatar: 96,
  card: 360,    // tarjetas del grid (2 columnas en móvil)
  cover: 800,   // portadas de categoría / perfil
  full: 1200,   // ficha del producto / visor
};
