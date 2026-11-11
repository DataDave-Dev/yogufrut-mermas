import type { ReactNode } from "react";

type Props = {
  titulo?: string;
  descripcion?: string;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Sin relleno interno: para tablas y listas que llegan al borde. */
  compacta?: boolean;
};

/** Superficie elevada. Con título se expone como región accesible con ese nombre. */
export function Tarjeta({ titulo, descripcion, accion, children, className = "", compacta = false }: Props) {
  const idTitulo = titulo ? `tarjeta-${titulo.toLowerCase().replace(/[^a-z0-9áéíóúñ]+/g, "-")}` : undefined;
  return (
    <section
      aria-labelledby={idTitulo}
      className={`rounded-2xl bg-white shadow-suave ring-1 ring-arena-200/70 ${compacta ? "" : "p-5"} ${className}`}
    >
      {titulo && (
        <header className={`flex items-start justify-between gap-3 ${compacta ? "px-5 pt-5 pb-3" : "mb-4"}`}>
          <div>
            <h2 id={idTitulo} className="font-display text-base font-semibold text-arena-900">
              {titulo}
            </h2>
            {descripcion && <p className="mt-0.5 text-sm text-arena-500">{descripcion}</p>}
          </div>
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}
