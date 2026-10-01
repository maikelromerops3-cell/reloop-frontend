import { cld, IMG } from "../img";
import { Heart, BadgeCheck } from "lucide-react";

// Tarjeta de artículo: foto en vertical, precio primero, y debajo quién lo vende (con su
// verificación) y dónde está. Sin marcos gruesos ni etiquetas de colores sobre la foto.
export default function ItemCard({ item, onOpen, saved, toggleSave, ratio = "4 / 5" }) {
  const meta = [item.size, item.condition].filter(Boolean).join(" · ");
  const place = item.distanceKm !== null && item.distanceKm !== undefined
    ? `a ${item.distanceKm < 1 ? "menos de 1" : Math.round(item.distanceKm)} km`
    : item.city;
  const initial = String(item.seller || "?")[0]?.toUpperCase();
  const isNew = item.minutesAgo < 30;

  return (
    <article className={"card" + (item.status === "sold" ? " card-sold" : "")} onClick={() => onOpen(item)}>
      <div className="card-media" style={{ aspectRatio: ratio }}>
        <img src={cld(item.photo, IMG.card)} alt={item.title} onError={(e) => { const el = e.currentTarget; if (el.dataset.fallback !== "1" && el.src !== item.photo) { el.dataset.fallback = "1"; el.src = item.photo; } else { el.style.visibility = "hidden"; } }} loading="lazy" decoding="async" className="card-media-img" />
        {item.featured
          ? <span className="chip-badge accent">Destacado</span>
          : isNew ? <span className="chip-badge ink">Nuevo</span> : null}
        <button
          className={"heart" + (saved ? " on" : "")}
          onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}
          aria-label={saved ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart size={16} />
        </button>
      </div>
      <div className="card-info">
        <div className="card-price-row">
          <b className="card-price">{Number(item.price).toLocaleString("es-ES")}&nbsp;€</b>
          {meta && <span className="card-meta">{meta}</span>}
        </div>
        <h3 className="card-title">{item.title}</h3>
        <div className="card-seller">
          <i className="card-avatar">{initial}</i>
          <span className="card-seller-name">{item.seller}</span>
          {item.verified && <BadgeCheck size={13} className="card-verified" aria-label="Vendedor verificado" />}
          {place && (<><span className="card-dot">·</span><span className="card-place">{place}</span></>)}
        </div>
      </div>
    </article>
  );
}
