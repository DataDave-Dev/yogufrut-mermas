import type { ReactNode } from "react";
import { estiloBoton } from "./boton";
import { Icono } from "./Icono";

type Props = { tituloLista: string; descripcionLista?: string; lista: ReactNode; tituloAlta: string; alta: ReactNode };

const SIN_MARCADOR = "cursor-pointer list-none [&::-webkit-details-marker]:hidden";

/** Pantallas de catálogo: la lista ocupa todo el ancho; el alta se despliega con el botón del encabezado. */
export function DisenoAdmin({ tituloLista, descripcionLista, lista, tituloAlta, alta }: Props) {
  return (
    <section aria-labelledby="titulo-lista" className="relative rounded-2xl bg-white shadow-suave ring-1 ring-arena-200/70">
      <header className="px-5 py-4 pr-48">
        <h2 id="titulo-lista" className="font-display text-lg font-semibold text-arena-900">
          {tituloLista}
        </h2>
        {descripcionLista && <p className="mt-0.5 text-sm text-arena-500">{descripcionLista}</p>}
      </header>
      {/* ponytail: <details> nativo, sin JavaScript; el botón queda arriba a la derecha con posición absoluta. */}
      <details className="group/alta">
        <summary className={`${estiloBoton({ tamano: "sm" })} ${SIN_MARCADOR} absolute top-3.5 right-5`}>
          <Icono nombre="mas" className="size-4 transition group-open/alta:rotate-45" />
          {tituloAlta}
        </summary>
        <div className="border-t border-arena-100 bg-arena-50/70 px-5 py-5">{alta}</div>
      </details>
      {lista}
    </section>
  );
}

/** Lista de filas dentro de la tarjeta. */
export function Filas({ children }: { children: ReactNode }) {
  return <ul className="divide-y divide-arena-100 border-t border-arena-100">{children}</ul>;
}

type FilaProps = {
  inactiva?: boolean;
  /** Contenido de la fila cerrada (una línea en escritorio). */
  resumen: ReactNode;
  /** Nombre del elemento, para el texto accesible «Editar …». */
  editar: string;
  /** Formularios de edición, visibles al abrir la fila. */
  children: ReactNode;
};

/** Fila compacta que se abre para editar. */
export function Fila({ inactiva = false, resumen, editar, children }: FilaProps) {
  return (
    <li className={inactiva ? "bg-arena-50/70" : ""}>
      <details className="group">
        <summary
          className={`${SIN_MARCADOR} flex items-center gap-4 px-5 py-3 transition hover:bg-arena-50 focus-visible:bg-arena-50 focus-visible:outline-none group-open:bg-arena-50`}
        >
          <div className="min-w-0 flex-1">{resumen}</div>
          <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-frambuesa-700">
            <span>
              Editar<span className="sr-only"> {editar}</span>
            </span>
            <Icono nombre="derecha" className="size-4 transition group-open:rotate-90" />
          </span>
        </summary>
        <div className="grid items-start gap-x-10 gap-y-6 border-t border-arena-100 bg-arena-50/50 px-5 py-5 lg:grid-cols-2">{children}</div>
      </details>
    </li>
  );
}
