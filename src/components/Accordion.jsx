import { useState } from "react";
import { ChevronDown } from "lucide-react";

// Sección plegable simple — se usa para Descripción / Cómo se entrega / Reseñas en la ficha
// de artículo, en vez de tenerlo todo desplegado de golpe. Empieza abierta por defecto porque
// en la mayoría de los casos es justo lo que la persona ha venido a leer.
export default function Accordion({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="acc-item">
      <button type="button" className="acc-head" onClick={() => setOpen((o) => !o)}>
        <span>{title}</span>
        <ChevronDown size={16} className={"acc-chev" + (open ? " open" : "")} />
      </button>
      {open && <div className="acc-body">{children}</div>}
    </div>
  );
}
