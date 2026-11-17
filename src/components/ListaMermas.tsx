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
  /** En pantallas anchas, columnas alineadas como tabla (fecha, producto, motivo, quién, costo). */
  columnas?: boolean;
};

// Columnas en pantallas anchas: fecha · producto · cantidad · motivo · registró · costo · flecha.
const GRID_COLUMNAS =
  "lg:grid lg:grid-cols-[10.5rem_minmax(0,2fr)_6.5rem_minmax(0,1fr)_minmax(0,1fr)_7.5rem_1rem] lg:gap-6";

export function ListaMermas({ mermas, mostrarUsuario = false, mostrarSucursal = false, vacio, compacta = false, columnas = false }: Props) {
  if (mermas.length === 0) return <EstadoVacio titulo={vacio} icono="lista" />;

  if (columnas) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-suave ring-1 ring-arena-200/70">
        <div aria-hidden className={`hidden border-b border-arena-100 bg-arena-50 px-5 py-2.5 text-xs font-medium tracking-wide text-arena-500 uppercase ${GRID_COLUMNAS}`}>
          <span>Fecha</span>
          <span>Producto</span>
          <span className="text-right">Cantidad</span>
          <span>Motivo</span>
          <span>{mostrarSucursal ? "Sucursal" : "Registró"}</span>
          <span className="text-right">Costo</span>
          <span />
        </div>
        <ul className="divide-y divide-arena-100">
          {mermas.map((m) => {
            const cancelada = Boolean(m.canceladaEn);
            return (
              <li key={m.id}>
                <Link
                  href={`/mermas/${m.id}`}
                  className={`group flex items-center gap-3 px-5 py-3 transition hover:bg-arena-50 focus-visible:bg-arena-50 focus-visible:outline-none lg:items-center ${GRID_COLUMNAS}`}
                >
                  <span className="hidden text-sm text-arena-600 lg:block">
                    {formatoFecha(m.creadaEn)} <span className="text-arena-400">{formatoHora(m.creadaEn)}</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={`flex flex-wrap items-center gap-x-2 gap-y-1 font-medium lg:block lg:[&>*+*]:ml-2 lg:[&>svg]:inline ${cancelada ? "text-arena-500" : "text-arena-900"}`}
                    >
                      {/* En celular la cantidad va junto al producto; en pantallas anchas tiene su columna. */}
                      <span className="lg:hidden">
                        {m.producto} · {formatoCantidad(m.cantidadMilesimas)} {m.unidad}
                      </span>
                      <span className="hidden lg:inline">{m.producto}</span>
                      {cancelada && <Insignia tono="peligro">Cancelado</Insignia>}
                      {m.tieneFoto && <Icono nombre="camara" className="size-4 text-arena-400" titulo="Con foto" />}
                    </span>
                    {/* En celular, el resto de datos en una línea. */}
                    <span className="mt-0.5 block truncate text-sm text-arena-500 lg:hidden">
                      {[m.motivo, `${formatoFecha(m.creadaEn)} ${formatoHora(m.creadaEn)}`, mostrarUsuario && m.usuario].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className={`cifra hidden text-right lg:block ${cancelada ? "text-arena-400" : "text-arena-800"}`}>
                    {formatoCantidad(m.cantidadMilesimas)} <span className="text-sm text-arena-400">{m.unidad}</span>
                  </span>
                  <span className="hidden truncate text-sm text-arena-700 lg:block">{m.motivo}</span>
                  <span className="hidden truncate text-sm text-arena-700 lg:block">{mostrarSucursal ? m.sucursal : m.usuario}</span>
                  <span className={`cifra shrink-0 text-right font-semibold ${cancelada ? "text-arena-400 line-through" : "text-arena-900"}`}>
                    {formatoPesos(m.costoTotalCentavos)}
                  </span>
                  <Icono nombre="derecha" className="size-4 shrink-0 text-arena-300 transition group-hover:translate-x-0.5 group-hover:text-arena-500" />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

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
                  {m.tieneFoto && <Icono nombre="camara" className="size-4 text-arena-400" titulo="Con foto" />}
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
