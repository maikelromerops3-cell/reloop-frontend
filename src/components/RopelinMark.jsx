// Símbolo de Ropelin: nudo de cuerda en forma de infinito (economía circular).
// Mismo trazado que los iconos de la app (public/icon-*.png, Android) — si se cambia aquí,
// regenerar también los PNG para que todo coincida.
// `halo` debe ser el color del fondo sobre el que va: es el hueco que hace que un tramo
// de cuerda pase "por encima" del otro en el cruce.
const KNOT = "M50 50 C62 70 88 70 86 50 C84 30 62 30 50 50 C38 70 16 70 14 50 C12 30 38 30 50 50 Z";
const OVER_HALO = "M41.46 40.40 C44.64 42.80 47.60 46.00 50.00 50.00 C52.40 54.00 55.36 57.20 58.54 59.60";
const OVER_ROPE = "M38.04 38.17 C42.50 40.66 46.76 44.60 50.00 50.00 C53.24 55.40 57.50 59.34 61.96 61.83";

export default function RopelinMark({ size = 20, rope = "#F4EFE4", halo = "var(--accent)", strokeWidth = 10 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={KNOT} fill="none" stroke={rope} strokeWidth={strokeWidth} strokeLinejoin="round" />
      <path d={OVER_HALO} fill="none" stroke={halo} strokeWidth={strokeWidth * 1.9} strokeLinecap="butt" />
      <path d={OVER_ROPE} fill="none" stroke={rope} strokeWidth={strokeWidth} strokeLinecap="butt" />
    </svg>
  );
}
