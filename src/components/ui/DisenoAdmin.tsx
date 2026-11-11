import type { ReactNode } from "react";
import { Tarjeta } from "./Tarjeta";

type Props = { tituloLista: string; descripcionLista?: string; lista: ReactNode; tituloAlta: string; alta: ReactNode };

/** Pantallas de catálogo: lista a la izquierda y alta fija a la derecha (abajo en celular, arriba la alta). */
export function DisenoAdmin({ tituloLista, descripcionLista, lista, tituloAlta, alta }: Props) {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Tarjeta titulo={tituloAlta} className="lg:sticky lg:top-8 lg:order-2">
        {alta}
      </Tarjeta>
      <Tarjeta titulo={tituloLista} descripcion={descripcionLista} compacta className="lg:order-1">
        {lista}
      </Tarjeta>
    </div>
  );
}

/** Lista de filas dentro de una tarjeta compacta. */
export function Filas({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-arena-100 border-t border-arena-100">{children}</ul>;
}

export function Fila({ inactiva = false, children }: { inactiva?: boolean; children: ReactNode }) {
  return <li className={`px-5 py-4 transition ${inactiva ? "bg-arena-50/70" : ""}`}>{children}</li>;
}
