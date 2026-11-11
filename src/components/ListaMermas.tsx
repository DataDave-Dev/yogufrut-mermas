import Link from "next/link";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos } from "@/lib/formato";
import type { MermaFila } from "@/lib/consultas-mermas";

type Props = { mermas: MermaFila[]; mostrarUsuario?: boolean; vacio: string };

export function ListaMermas({ mermas, mostrarUsuario = false, vacio }: Props) {
  if (mermas.length === 0) {
    return <p className="rounded-2xl bg-white p-6 text-stone-600 ring-1 ring-stone-200">{vacio}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {mermas.map((m) => (
        <li key={m.id}>
          <Link
            href={`/mermas/${m.id}`}
            className={`block rounded-xl bg-white p-4 ring-1 ring-stone-200 transition hover:ring-rose-300 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none ${m.canceladaEn ? "opacity-60" : ""}`}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-semibold">
                {m.producto} · {formatoCantidad(m.cantidadMilesimas)} {m.unidad}
              </p>
              <p className={`font-semibold ${m.canceladaEn ? "text-stone-500 line-through" : "text-rose-700"}`}>
                {formatoPesos(m.costoTotalCentavos)}
              </p>
            </div>
            <p className="text-sm text-stone-600">
              {m.motivo} · {formatoFecha(m.creadaEn)} {formatoHora(m.creadaEn)}
              {mostrarUsuario && <> · {m.usuario}</>}
              {m.tieneFoto && <> · 📷</>}
              {m.canceladaEn && <span className="ml-2 font-medium text-red-700">Cancelado</span>}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
