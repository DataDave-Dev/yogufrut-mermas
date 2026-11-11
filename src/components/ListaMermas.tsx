import Link from "next/link";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos } from "@/lib/formato";
import type { MermaFila } from "@/lib/consultas-mermas";
import { EstadoVacio } from "./ui/EstadoVacio";
import { Icono } from "./ui/Icono";
import { Insignia } from "./ui/Insignia";

type Props = {
  mermas: MermaFila[];
  mostrarUsuario?: boolean;
  mostrarSucursal?: boolean;
  vacio: string;
  /** Dentro de una tarjeta: filas separadas por línea en vez de tarjetas sueltas. */
  compacta?: boolean;
};

export function ListaMermas({ mermas, mostrarUsuario = false, mostrarSucursal = false, vacio, compacta = false }: Props) {
  if (mermas.length === 0) return <EstadoVacio titulo={vacio} icono="lista" />;

  return (
    <ul className={compacta ? "-mx-5 -mb-5 divide-y divide-arena-100" : "flex flex-col gap-2"}>
      {mermas.map((m) => {
        const cancelada = Boolean(m.canceladaEn);
        const meta = [
          m.motivo,
          `${formatoFecha(m.creadaEn)} ${formatoHora(m.creadaEn)}`,
          mostrarUsuario && m.usuario,
          mostrarSucursal && m.sucursal,
        ].filter(Boolean);
        return (
          <li key={m.id}>
            <Link
              href={`/mermas/${m.id}`}
              className={`group flex items-center gap-3 transition focus-visible:ring-2 focus-visible:ring-frambuesa-200 focus-visible:outline-none ${
                compacta
                  ? "px-5 py-3 hover:bg-arena-50"
                  : "rounded-2xl bg-white px-4 py-3.5 shadow-suave ring-1 ring-arena-200/70 hover:ring-frambuesa-200"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-medium ${cancelada ? "text-arena-500" : "text-arena-900"}`}>
                  <span>
                    {m.producto} · {formatoCantidad(m.cantidadMilesimas)} {m.unidad}
                  </span>
                  {cancelada && <Insignia tono="peligro">Cancelado</Insignia>}
                  {m.tieneFoto && (
                    <span className="text-arena-400" title="Con foto">
                      <Icono nombre="camara" className="size-4" titulo="Con foto" />
                    </span>
                  )}
                </p>
                <p className="mt-0.5 truncate text-sm text-arena-500">{meta.join(" · ")}</p>
              </div>
              <p className={`cifra shrink-0 font-semibold ${cancelada ? "text-arena-400 line-through" : "text-arena-900"}`}>
                {formatoPesos(m.costoTotalCentavos)}
              </p>
              <Icono nombre="derecha" className="size-4 shrink-0 text-arena-300 transition group-hover:translate-x-0.5 group-hover:text-arena-500" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
