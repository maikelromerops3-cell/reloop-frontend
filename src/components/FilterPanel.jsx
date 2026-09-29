import { MapPin, Heart, X } from "lucide-react";

const SIZES = ["XS", "S", "M", "L", "XL"];
const SORTS = [
  { v: "recent", l: "Más recientes" },
  { v: "price_asc", l: "Precio: menor a mayor" },
  { v: "price_desc", l: "Precio: mayor a menor" },
];
const DISTANCES = [
  { v: "", l: "Cualquier distancia" },
  { v: "5", l: "Menos de 5 km" },
  { v: "10", l: "Menos de 10 km" },
  { v: "25", l: "Menos de 25 km" },
  { v: "50", l: "Menos de 50 km" },
  { v: "100", l: "Menos de 100 km" },
];

// Panel de filtros con el diseño nuevo: secciones separadas en vez de un desplegable con
// selects sueltos. El mismo componente sirve de barra lateral fija en escritorio y de hoja
// que se desliza desde abajo en móvil — todo el estado y los manejadores vienen de fuera,
// este componente solo se encarga de cómo se ve.
export default function FilterPanel({
  priceFilter, setPriceFilter, sizeFilter, setSizeFilter, sortBy, setSortBy,
  distanceFilter, setDistanceFilter, myLocation, locatingMe, onDetectLocation,
  onClearFilters, hasActiveFilters, onCloseItemView,
  canSaveSearch, onSaveSearch, savedSearches, onPickSavedSearch, onDeleteSavedSearch,
}) {
  const touch = (fn) => (v) => { fn(v); if (onCloseItemView) onCloseItemView(); };

  return (
    <div className="fp">
      <div className="fp-sec">
        <h4>Ordenar por</h4>
        <div className="fp-sort">
          {SORTS.map((s) => (
            <button key={s.v} className={"fp-sort-opt" + (sortBy === s.v ? " on" : "")} onClick={() => touch(setSortBy)(s.v)}>
              {s.l}
            </button>
          ))}
          {myLocation && (
            <button className={"fp-sort-opt" + (sortBy === "distance" ? " on" : "")} onClick={() => touch(setSortBy)("distance")}>
              Distancia: más cerca
            </button>
          )}
        </div>
      </div>

      <div className="fp-sec">
        <h4>Precio</h4>
        <div className="fp-price">
          <input type="number" inputMode="numeric" placeholder="Mín." value={priceFilter.min} onChange={(e) => touch((v) => setPriceFilter((p) => ({ ...p, min: v })))(e.target.value)} />
          <span>–</span>
          <input type="number" inputMode="numeric" placeholder="Máx." value={priceFilter.max} onChange={(e) => touch((v) => setPriceFilter((p) => ({ ...p, max: v })))(e.target.value)} />
          <span className="fp-eur">€</span>
        </div>
      </div>

      <div className="fp-sec">
        <h4>Talla</h4>
        <div className="fp-sizes">
          {SIZES.map((s) => (
            <button key={s} className={"fp-size" + (sizeFilter === s ? " on" : "")} onClick={() => touch(setSizeFilter)(sizeFilter === s ? "" : s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="fp-sec">
        <h4>Distancia</h4>
        {myLocation ? (
          <select className="fp-select" value={distanceFilter} onChange={(e) => touch(setDistanceFilter)(e.target.value)}>
            {DISTANCES.map((d) => <option key={d.v} value={d.v}>{d.l}</option>)}
          </select>
        ) : (
          <button className="fp-locate" onClick={onDetectLocation} disabled={locatingMe}>
            <MapPin size={14} /> {locatingMe ? "Detectando…" : "Activar ubicación"}
          </button>
        )}
      </div>

      {(hasActiveFilters || canSaveSearch) && (
        <div className="fp-sec fp-actions">
          {hasActiveFilters && <button className="fp-clear" onClick={onClearFilters}>Quitar filtros</button>}
          {canSaveSearch && <button className="fp-save" onClick={onSaveSearch}><Heart size={13} /> Guardar esta búsqueda</button>}
        </div>
      )}

      {savedSearches && savedSearches.length > 0 && (
        <div className="fp-sec">
          <h4>Tus búsquedas guardadas</h4>
          <div className="fp-saved">
            {savedSearches.map((s) => (
              <div key={s.id} className="fp-saved-chip">
                <span onClick={() => onPickSavedSearch(s)}>{s.query || s.category || "Todos"}{s.query && s.category ? ` en ${s.category}` : ""}</span>
                <button onClick={() => onDeleteSavedSearch(s.id)} aria-label="Eliminar búsqueda guardada"><X size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
