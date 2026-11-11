import Link from "next/link";
import type { ReactNode } from "react";
import { Tarjeta } from "./ui/Tarjeta";

export type FilaRanking = {
  clave: string | number;
  nombre: string;
  detalle: ReactNode;
  valor: number;
  textoValor: string;
  href?: string;
};

type Props = {
  titulo: string;
  descripcion?: string;
  filas: FilaRanking[];
  vacio: string;
  accion?: ReactNode;
  className?: string;
};

/** Lista ordenada con barra proporcional al valor (CSS puro, sin librería de gráficas). */
export function Ranking({ titulo, descripcion, filas, vacio, accion, className }: Props) {
  const maximo = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <Tarjeta titulo={titulo} descripcion={descripcion} accion={accion} className={className}>
      {filas.length === 0 ? (
        <p className="text-sm text-arena-500">{vacio}</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {filas.map((f, i) => {
            const contenido = (
              <>
                <div className="flex items-baseline gap-3 text-sm">
                  <span className="cifra w-4 shrink-0 text-xs text-arena-400">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium text-arena-800">{f.nombre}</span>
                  <span className="cifra font-semibold text-arena-900">{f.textoValor}</span>
                </div>
                <div className="mt-1.5 ml-7 h-1.5 overflow-hidden rounded-full bg-arena-100" aria-hidden>
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-frambuesa-500" : "bg-frambuesa-300"}`}
                    style={{ width: `${Math.max(4, (f.valor / maximo) * 100)}%` }}
                  />
                </div>
                <p className="mt-1 ml-7 text-xs text-arena-500">{f.detalle}</p>
              </>
            );
            return (
              <li key={f.clave}>
                {f.href ? (
                  <Link
                    href={f.href}
                    className="-mx-2 block rounded-xl px-2 py-1.5 transition hover:bg-arena-50 focus-visible:ring-2 focus-visible:ring-frambuesa-200 focus-visible:outline-none"
                  >
                    {contenido}
                  </Link>
                ) : (
                  <div className="py-1.5">{contenido}</div>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </Tarjeta>
  );
}
