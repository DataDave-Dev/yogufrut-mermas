import { Tarjeta } from "./ui/Tarjeta";

export type Barra = { etiqueta: string; valor: number; texto: string };

type Props = { titulo: string; descripcion?: string; barras: Barra[]; className?: string };

/** Barras verticales con etiqueta (CSS puro). La más alta se resalta. */
export function Barras({ titulo, descripcion, barras, className }: Props) {
  const maximo = Math.max(1, ...barras.map((b) => b.valor));
  return (
    <Tarjeta titulo={titulo} descripcion={descripcion} className={className}>
      <ol className="flex h-40 items-end gap-1.5">
        {barras.map((b) => (
          <li key={b.etiqueta} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
            {b.valor > 0 ? (
              <span
                role="img"
                title={`${b.etiqueta}: ${b.texto}`}
                aria-label={`${b.etiqueta}: ${b.texto}`}
                className={`w-full rounded-t-md ${b.valor === maximo ? "bg-frambuesa-600" : "bg-frambuesa-300"}`}
                style={{ height: `${Math.max(6, (b.valor / maximo) * 100)}%` }}
              />
            ) : (
              <span title={`${b.etiqueta}: sin registros`} className="h-1 w-full rounded-full bg-arena-100" />
            )}
            <span aria-hidden className="cifra text-[0.6875rem] text-arena-500">
              {b.etiqueta}
            </span>
          </li>
        ))}
      </ol>
    </Tarjeta>
  );
}
