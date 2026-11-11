import type { ReactNode } from "react";

type Props = { antetitulo?: ReactNode; titulo: string; descripcion?: ReactNode; acciones?: ReactNode };

export function EncabezadoPagina({ antetitulo, titulo, descripcion, acciones }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {antetitulo && <div className="mb-1 text-sm font-medium text-frambuesa-600">{antetitulo}</div>}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-arena-900 sm:text-3xl">{titulo}</h1>
        {descripcion && <p className="mt-1 max-w-prose text-arena-600">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
    </header>
  );
}
