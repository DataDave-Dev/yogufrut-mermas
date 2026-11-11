import type { ReactNode } from "react";

/** Panel plegable nativo para editar una fila sin JavaScript extra. */
export function Editar({ resumen, children }: { resumen: string; children: ReactNode }) {
  return (
    <details className="group mt-2">
      <summary className="cursor-pointer text-sm font-medium text-rose-700 hover:underline">{resumen}</summary>
      <div className="mt-3 flex flex-col gap-4 border-t border-stone-100 pt-3">{children}</div>
    </details>
  );
}
