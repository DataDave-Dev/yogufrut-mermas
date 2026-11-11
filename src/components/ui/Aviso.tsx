import type { ReactNode } from "react";
import { Icono, type NombreIcono } from "./Icono";

type Tono = "exito" | "alerta" | "peligro" | "info";

const TONOS: Record<Tono, { clase: string; icono: NombreIcono }> = {
  exito: { clase: "bg-menta-50 text-menta-700 ring-menta-100", icono: "check" },
  alerta: { clase: "bg-miel-50 text-miel-700 ring-miel-100", icono: "alerta" },
  peligro: { clase: "bg-rojo-50 text-rojo-700 ring-rojo-100", icono: "alerta" },
  info: { clase: "bg-arena-100 text-arena-700 ring-arena-200", icono: "alerta" },
};

type Props = { tono: Tono; children: ReactNode; rol?: "status" | "alert" | "alertdialog"; className?: string; id?: string };

/** Mensaje en línea. Éxito usa role="status"; errores y advertencias, role="alert". */
export function Aviso({ tono, children, rol, className = "", id }: Props) {
  const { clase, icono } = TONOS[tono];
  return (
    <div
      id={id}
      role={rol ?? (tono === "exito" || tono === "info" ? "status" : "alert")}
      className={`flex items-start gap-2.5 rounded-xl px-3.5 py-3 text-sm ring-1 ${clase} ${className}`}
    >
      <Icono nombre={icono} className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
