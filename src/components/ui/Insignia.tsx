import type { ReactNode } from "react";

type Tono = "neutro" | "acento" | "exito" | "alerta" | "peligro";

const TONOS: Record<Tono, string> = {
  neutro: "bg-arena-100 text-arena-600 ring-arena-200",
  acento: "bg-frambuesa-50 text-frambuesa-700 ring-frambuesa-100",
  exito: "bg-menta-50 text-menta-700 ring-menta-100",
  alerta: "bg-miel-50 text-miel-700 ring-miel-100",
  peligro: "bg-rojo-50 text-rojo-700 ring-rojo-100",
};

export function Insignia({ tono = "neutro", children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONOS[tono]}`}>
      {children}
    </span>
  );
}
