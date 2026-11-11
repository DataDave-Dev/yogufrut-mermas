import type { ReactNode } from "react";
import { Icono } from "./ui/Icono";

/** Panel plegable nativo para editar una fila sin JavaScript extra. */
export function Editar({ resumen, children }: { resumen: string; children: ReactNode }) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 rounded-lg text-sm font-medium text-frambuesa-700 transition hover:text-frambuesa-800 focus-visible:ring-2 focus-visible:ring-frambuesa-200 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <Icono nombre="derecha" className="size-4 transition group-open:rotate-90" />
        {resumen}
      </summary>
      <div className="mt-3 flex flex-col gap-5 border-t border-arena-100 pt-4">{children}</div>
    </details>
  );
}
