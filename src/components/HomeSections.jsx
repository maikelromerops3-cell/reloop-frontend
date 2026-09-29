import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, BadgeCheck, ChevronLeft, ChevronRight, HelpCircle, Heart, MapPin, Plus, ShieldCheck, Truck, Undo2 } from "lucide-react";
import ItemCard from "./ItemCard";

const fmtPrice = (n) => `${Number(n).toLocaleString("es-ES")}\u00a0€`;

const TRUST = [
  { icon: ShieldCheck, title: "Pago protegido", short: "Tu dinero espera a que confirmes", text: "Retenemos el pago hasta que confirmas la entrega." },
  { icon: Truck, title: "Envío con seguimiento", short: "Con el precio real del transportista", text: "Correos, InPost y más, con el precio real para tu dirección." },
  { icon: BadgeCheck, title: "Vendedores verificados", short: "Identidad comprobada", text: "Identidad comprobada por nuestro equipo." },
  { icon: Undo2, title: "Si algo falla, mediamos", short: "", text: "Disputas con pruebas de ambas partes." },
];

// Foto grande de un artículo destacado, con el precio y el vendedor encima
function FeatureCard({ item, onOpen, saved, toggleSave, className = "" }) {
  return (
    <article className={"feat-card " + className} onClick={() => onOpen(item)}>
      <img src={item.photo} alt={item.title} loading="lazy" decoding="async" />
      <div className="feat-top">
        {item.featured ? <span className="chip-badge accent static">Destacado</span> : <span />}
        <button className={"heart" + (saved ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }} aria-label={saved ? "Quitar de favoritos" : "Añadir a favoritos"}>
          <Heart size={16} />
        </button>
      </div>
      <div className="feat-bottom">
        <div className="feat-price">{fmtPrice(item.price)}</div>
        <h3 className="feat-title">{item.title}</h3>
        <div className="feat-seller">
          <i className="card-avatar light">{String(item.seller || "?")[0]?.toUpperCase()}</i>
          {item.seller}
          {item.verified && <BadgeCheck size={14} />}
          {item.city && <><span className="card-dot">·</span>{item.city}</>}
        </div>
      </div>
    </article>
  );
}

function SectionHead({ title, sub, onMore, moreLabel = "Ver todo" }) {
  return (
    <div className="hm-head">
      <h2>{title}</h2>
      {sub && <span className="hm-sub">{sub}</span>}
      {onMore && <button className="hm-more" onClick={onMore}>{moreLabel} <ArrowRight size={15} /></button>}
    </div>
  );
}

function SellCta({ onSell, compact }) {
  return (
    <section className={"hm-sell" + (compact ? " compact" : "")}>
      <div>
        <small>Vende en Ropelin</small>
        <h2>¿Algo que ya no usas?</h2>
        <p>Publícalo en un minuto y recibe el precio íntegro del artículo.</p>
      </div>
      <div className="hm-sell-row">
        <div className="hm-steps"><div><b>1</b>Haz fotos</div><div><b>2</b>Pon precio</div><div><b>3</b>Cobra seguro</div></div>
        <button className="hm-sell-btn" onClick={onSell}><Plus size={17} /> Empezar a vender</button>
      </div>
    </section>
  );
}

export default function HomeSections({ items, categories, isDesktop, hasLocation, saved, toggleSave, onOpen, onSell, onPickCategory, onHowItWorks, onNearMe }) {
  const scroller = useRef(null);
  const [slide, setSlide] = useState(0);
  const [heroIdx, setHeroIdx] = useState(0);
  if (!items.length) return null;

  // Escaparate: primero los destacados; si no hay suficientes, completamos con lo más reciente
  const featured = items.filter((i) => i.featured);
  const recent = [...items].sort((a, b) => a.minutesAgo - b.minutesAgo);
  const showcase = [...featured, ...recent.filter((i) => !i.featured)].slice(0, 6);
  const nearby = items.filter((i) => i.distanceKm !== null && i.distanceKm !== undefined).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 8);

  // Categorías con foto y recuento reales
  const tiles = categories
    .map((c) => {
      const inCat = items.filter((i) => i.category === c);
      const cover = inCat.find((i) => i.featured) || inCat[0];
      return { name: c, count: inCat.length, cover: cover?.photo };
    })
    .filter((t) => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const onScroll = (e) => {
    const el = e.currentTarget;
    const card = el.firstElementChild;
    if (!card) return;
    setSlide(Math.round(el.scrollLeft / (card.offsetWidth + 12)));
  };
  const hero = showcase[heroIdx % showcase.length];

  return (
    <div className="home">
      {/* ---------- Escaparate ---------- */}
      {isDesktop ? (
        <section className="hm-hero">
          <div className="hm-hero-main">
            <FeatureCard item={hero} onOpen={onOpen} saved={saved.has(hero.id)} toggleSave={toggleSave} className="big" />
            {showcase.length > 1 && (
              <div className="hm-arrows">
                <button aria-label="Anterior" onClick={() => setHeroIdx((i) => (i - 1 + showcase.length) % showcase.length)}><ChevronLeft size={18} /></button>
                <button aria-label="Siguiente" onClick={() => setHeroIdx((i) => (i + 1) % showcase.length)}><ChevronRight size={18} /></button>
              </div>
            )}
          </div>
          <SellCta onSell={onSell} />
          <button className="hm-tile near" onClick={onNearMe}>
            <h3>Cerca de ti</h3>
            <span>{hasLocation ? `${nearby.length} artículos cerca` : "Activa tu ubicación"}</span>
            <svg className="hm-map" viewBox="0 0 300 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <g fill="none" stroke="currentColor" strokeWidth="11" strokeLinecap="round" opacity=".16">
                <path d="M-10 200 C60 160 110 220 180 170 S280 130 320 150" /><path d="M50 -10 C80 60 40 120 100 185 S160 250 150 285" /><path d="M215 -10 C205 60 265 95 245 160" />
              </g>
              <circle cx="165" cy="150" r="84" fill="var(--accent)" fillOpacity=".08" stroke="var(--accent)" strokeOpacity=".35" strokeDasharray="4 5" />
            </svg>
            <i className="hm-pin" style={{ left: "52%", top: "52%" }}><MapPin size={14} /></i>
            <i className="hm-pin" style={{ left: "34%", top: "68%" }}><MapPin size={14} /></i>
            <i className="hm-pin" style={{ left: "68%", top: "72%" }}><MapPin size={14} /></i>
          </button>
          <button className="hm-tile help" onClick={onHowItWorks}>
            <HelpCircle size={30} />
            <div><b>Cómo funciona</b><span>Compra, vende y paga con protección en pocos pasos.</span></div>
          </button>
        </section>
      ) : (
        <>
          <section className="hm-showcase">
            <div className="hm-scroller" ref={scroller} onScroll={onScroll}>
              {showcase.map((it) => <FeatureCard key={it.id} item={it} onOpen={onOpen} saved={saved.has(it.id)} toggleSave={toggleSave} />)}
            </div>
            {showcase.length > 1 && <div className="hm-dots">{showcase.map((it, i) => <i key={it.id} className={i === slide ? "on" : ""} />)}</div>}
          </section>
        </>
      )}

      {/* ---------- Confianza ---------- */}
      <section className="hm-trust">
        {TRUST.slice(0, isDesktop ? 4 : 3).map((t) => (
          <div key={t.title} className="hm-trust-i">
            <t.icon size={isDesktop ? 26 : 20} />
            <div><b>{t.title}</b><span>{isDesktop ? t.text : t.short}</span></div>
          </div>
        ))}
      </section>

      {/* ---------- Cerca de ti ---------- */}
      {nearby.length > 0 && (
        <section className="hm-sec">
          <SectionHead title="Cerca de ti" onMore={onNearMe} />
          <div className="hm-rail">
            {nearby.map((it) => <ItemCard key={it.id} item={it} onOpen={onOpen} saved={saved.has(it.id)} toggleSave={toggleSave} />)}
          </div>
        </section>
      )}

      {/* ---------- Vender (solo móvil; en escritorio va en el escaparate) ---------- */}
      {!isDesktop && <SellCta onSell={onSell} compact />}

      {/* ---------- Categorías con foto ---------- */}
      {tiles.length > 0 && (
        <section className="hm-sec">
          <SectionHead title="Explora por categoría" />
          <div className={"hm-bento n-" + tiles.length}>
            {tiles.map((t, i) => (
              <button key={t.name} className="hm-cat-tile" onClick={() => onPickCategory(t.name)}>
                {t.cover && <img src={t.cover} alt="" loading="lazy" decoding="async" />}
                <span className="hm-cat-lab"><b>{t.name}</b><small>{t.count.toLocaleString("es-ES")} artículo{t.count === 1 ? "" : "s"}</small></span>
                {i === 0 && <span className="hm-cat-go"><ArrowUpRight size={16} /></span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
