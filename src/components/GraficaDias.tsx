import Link from "next/link";
import { formatoPesos } from "@/lib/formato";
import { Tarjeta } from "./ui/Tarjeta";

type Dia = { fecha: string; registros: number; costoCentavos: number };

type Props = {
  /** Todos los días del periodo (AAAA-MM-DD), incluidos los que no tienen mermas. */
  fechas: string[];
  dias: Dia[];
  /** Enlace de cada barra (p. ej. al historial de ese día). Sin él, las barras no son enlaces. */
  href?: (fecha: string) => string;
  descripcion?: string;
};

/** Barras verticales por día (CSS puro). Cada barra lleva al historial de ese día. */
export function GraficaDias({ fechas, dias, href, descripcion = href ? "Toca un día para ver sus registros" : undefined }: Props) {
  const porFecha = new Map(dias.map((d) => [d.fecha, d]));
  const maximo = Math.max(1, ...dias.map((d) => d.costoCentavos));
  const etiquetaCada = fechas.length > 16 ? 5 : 1;

  return (
    <Tarjeta titulo="Costo por día" descripcion={descripcion}>
      <ol className="flex h-44 items-end gap-1 sm:gap-1.5">
        {fechas.map((fecha, i) => {
          const d = porFecha.get(fecha);
          const dia = Number(fecha.slice(8));
          const texto = d
            ? `${fecha.split("-").reverse().join("/")}: ${formatoPesos(d.costoCentavos)} · ${d.registros} ${d.registros === 1 ? "registro" : "registros"}`
            : `${fecha.split("-").reverse().join("/")}: sin registros`;
          return (
            <li key={fecha} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
              {d && !href ? (
                <span title={texto} role="img" aria-label={texto} className="w-full rounded-t-md bg-frambuesa-400" style={{ height: `${Math.max(6, (d.costoCentavos / maximo) * 100)}%` }} />
              ) : d && href ? (
                <Link
                  href={href(fecha)}
                  title={texto}
                  aria-label={texto}
                  className="w-full rounded-t-md bg-frambuesa-400 transition hover:bg-frambuesa-600 focus-visible:ring-2 focus-visible:ring-frambuesa-200 focus-visible:outline-none"
                  style={{ height: `${Math.max(6, (d.costoCentavos / maximo) * 100)}%` }}
                />
              ) : (
                <span title={texto} className="h-1 w-full rounded-full bg-arena-100" />
              )}
              <span aria-hidden className={`cifra text-[0.6875rem] text-arena-400 ${i % etiquetaCada === 0 || dia === 1 ? "" : "invisible"}`}>
                {dia}
              </span>
            </li>
          );
        })}
      </ol>
    </Tarjeta>
  );
}
