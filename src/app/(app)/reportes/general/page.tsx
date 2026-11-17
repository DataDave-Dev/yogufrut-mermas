import Link from "next/link";
import { Barras } from "@/components/Barras";
import { GraficaDias } from "@/components/GraficaDias";
import { Ranking } from "@/components/Ranking";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { estiloBoton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/Icono";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Indicador } from "@/components/ui/Indicador";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { requireUsuario } from "@/lib/auth";
import { barrasDiaSemana, porcentaje } from "@/lib/analisis";
import { formatoPesos } from "@/lib/formato";
import { desplazar, etiquetaPeriodo, fechasDelPeriodo, leerPeriodo, variacion } from "@/lib/periodos";
import { obtenerReporte, obtenerResumenGeneral } from "@/lib/reportes";
import { rutaImprimirGeneral, rutaReporte, rutaResumenGeneral } from "@/lib/rutas-reportes";

const veces = (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`;

export const metadata = { title: "Resumen general" };

export default async function ResumenGeneral({ searchParams }: PageProps<"/reportes/general">) {
  await requireUsuario(["admin"]);
  const parametros = await searchParams;
  const periodo = leerPeriodo(parametros.tipo, parametros.fecha);
  const [r, anterior, global] = await Promise.all([
    obtenerResumenGeneral(periodo),
    obtenerResumenGeneral(desplazar(periodo, -1)),
    obtenerReporte(undefined, periodo, 6),
  ]);
  const maximo = Math.max(1, ...r.sucursales.map((s) => s.costoCentavos));
  const costoAnterior = new Map(anterior.sucursales.map((s) => [s.id, s.costoCentavos]));
  const conMermas = r.sucursales.filter((s) => s.registros > 0);

  return (
    <>
      <EncabezadoPagina
        antetitulo="Reportes"
        titulo="Resumen general"
        descripcion="Mermas de todas las sucursales en el periodo."
        acciones={
          <Link href={rutaImprimirGeneral(periodo.tipo, periodo.inicio)} target="_blank" rel="noopener" className={estiloBoton({ variante: "secundario" })}>
            <Icono nombre="imprimir" className="size-4" /> Exportar PDF
          </Link>
        }
      />
      <SelectorPeriodo periodo={periodo} href={rutaResumenGeneral} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta={`Costo total · ${etiquetaPeriodo(periodo)}`}
          valor={formatoPesos(r.costoCentavos)}
          variacion={variacion(r.costoCentavos, anterior.costoCentavos)}
          detalle="vs. periodo anterior"
          destacado
        />
        <Indicador etiqueta="Registros" valor={String(r.registros)} icono="lista" detalle={`${anterior.registros} en el periodo anterior`} />
        <Indicador
          etiqueta="Promedio por sucursal"
          valor={conMermas.length ? formatoPesos(Math.round(r.costoCentavos / conMermas.length)) : "—"}
          detalle={`${conMermas.length} de ${r.sucursales.length} con mermas`}
          icono="sucursal"
        />
        <Indicador
          etiqueta="Sucursal con más merma"
          valor={conMermas[0]?.nombre ?? "—"}
          detalle={conMermas[0] ? `${formatoPesos(conMermas[0].costoCentavos)} · ${porcentaje(conMermas[0].costoCentavos, r.costoCentavos)} del total` : undefined}
          icono="alerta"
          compacto
        />
      </div>

      {global.registros > 0 && periodo.tipo !== "dia" && <GraficaDias fechas={fechasDelPeriodo(periodo)} dias={global.dias} />}

      <Tarjeta titulo="Sucursales" descripcion="Ordenadas por costo de mermas" compacta>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-arena-100 bg-arena-50 text-xs tracking-wide text-arena-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Sucursal</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Registros</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Costo</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">% del total</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">vs. anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-arena-100">
              {r.sucursales.map((s) => (
                <tr key={s.id} className="transition hover:bg-arena-50">
                  <th scope="row" className="px-5 py-3 font-medium">
                    <Link href={rutaReporte(periodo.tipo, periodo.inicio, s.id)} className="text-arena-900 hover:text-frambuesa-700">
                      {s.nombre}
                    </Link>
                    {!s.activa && (
                      <span className="ml-2">
                        <Insignia>Desactivada</Insignia>
                      </span>
                    )}
                    <div aria-hidden className="mt-1.5 h-1 max-w-48 overflow-hidden rounded-full bg-arena-100">
                      <div className="h-full rounded-full bg-frambuesa-400" style={{ width: `${(s.costoCentavos / maximo) * 100}%` }} />
                    </div>
                  </th>
                  <td className="cifra px-5 py-3 text-right">{s.registros}</td>
                  <td className="cifra px-5 py-3 text-right font-semibold">{formatoPesos(s.costoCentavos)}</td>
                  <td className="cifra px-5 py-3 text-right text-arena-600">{porcentaje(s.costoCentavos, r.costoCentavos)}</td>
                  <td className="cifra px-5 py-3 text-right">
                    <Cambio valor={variacion(s.costoCentavos, costoAnterior.get(s.id) ?? 0)} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-arena-200 bg-arena-50 font-semibold">
              <tr>
                <th scope="row" className="px-5 py-3">Total</th>
                <td className="cifra px-5 py-3 text-right">{r.registros}</td>
                <td className="cifra px-5 py-3 text-right">{formatoPesos(r.costoCentavos)}</td>
                <td />
                <td className="cifra px-5 py-3 text-right">
                  <Cambio valor={variacion(r.costoCentavos, anterior.costoCentavos)} />
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Tarjeta>

      {global.registros > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Ranking
            titulo="Productos con más merma"
            descripcion="Todas las sucursales"
            vacio="—"
            filas={global.productos.map((p) => ({
              clave: `${p.id}-${p.unidad}`,
              nombre: p.nombre,
              valor: p.costoCentavos,
              textoValor: formatoPesos(p.costoCentavos),
              detalle: veces(p.registros),
            }))}
          />
          <Ranking
            titulo="Motivos más frecuentes"
            vacio="—"
            filas={global.motivos.map((m) => ({
              clave: m.id,
              nombre: m.nombre,
              valor: m.registros,
              textoValor: veces(m.registros),
              detalle: formatoPesos(m.costoCentavos),
            }))}
          />
          <Ranking
            titulo="Costo por categoría"
            vacio="—"
            filas={global.categorias.slice(0, 6).map((c) => ({
              clave: c.nombre,
              nombre: c.nombre,
              valor: c.costoCentavos,
              textoValor: formatoPesos(c.costoCentavos),
              detalle: `${porcentaje(c.costoCentavos, global.costoCentavos)} del costo`,
            }))}
          />
          {periodo.tipo !== "dia" && <Barras titulo="Costo por día de la semana" barras={barrasDiaSemana(global.diasSemana)} />}
        </div>
      )}
    </>
  );
}

/** Variación contra el periodo anterior: subir es malo (rojo), bajar es bueno (verde). */
function Cambio({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-arena-400">—</span>;
  return <span className={valor > 0 ? "text-rojo-600" : "text-menta-600"}>{`${valor > 0 ? "+" : ""}${valor.toFixed(1)}%`}</span>;
}
