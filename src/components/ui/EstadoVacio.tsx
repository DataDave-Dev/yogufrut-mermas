import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";

type Props = { titulo: string; descripcion?: string; icono?: NombreIcono; accion?: ReactNode };

export function EstadoVacio({ titulo, descripcion, icono = "vacio", accion }: Props) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-arena-300 bg-white/60 px-6 py-10 text-center">
      <span className="mb-1 grid size-11 place-items-center rounded-xl bg-arena-100 text-arena-500">
        <Icono nombre={icono} />
      </span>
      <p className="font-display font-semibold text-arena-800">{titulo}</p>
      {descripcion && <p className="max-w-sm text-sm text-arena-500">{descripcion}</p>}
      {accion && <div className="mt-2">{accion}</div>}
    </div>
  );
}
