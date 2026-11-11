// Estilos de botón como función: sirven igual para <button>, <Link> y <a>.

type Variante = "primario" | "secundario" | "fantasma" | "peligro" | "peligroSolido";
type Tamano = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition " +
  "focus-visible:outline-none focus-visible:ring-4 active:translate-y-px disabled:pointer-events-none disabled:opacity-55";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-frambuesa-600 text-white shadow-acento hover:bg-frambuesa-700 focus-visible:ring-frambuesa-200",
  secundario:
    "bg-white text-arena-800 ring-1 ring-arena-200 shadow-suave hover:bg-arena-50 hover:ring-arena-300 focus-visible:ring-frambuesa-100",
  fantasma: "text-arena-700 hover:bg-arena-100 hover:text-arena-900 focus-visible:ring-frambuesa-100",
  peligro: "bg-white text-rojo-700 ring-1 ring-rojo-100 hover:bg-rojo-50 focus-visible:ring-rojo-100",
  peligroSolido: "bg-rojo-600 text-white hover:bg-rojo-700 focus-visible:ring-rojo-100",
};

const TAMANOS: Record<Tamano, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-base",
};

export function estiloBoton({
  variante = "primario",
  tamano = "md",
  ancho = false,
}: { variante?: Variante; tamano?: Tamano; ancho?: boolean } = {}): string {
  return `${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]}${ancho ? " w-full" : ""}`;
}
