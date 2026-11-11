import Link from "next/link";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Indicador } from "@/components/ui/Indicador";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { requireUsuario } from "@/lib/auth";
import { formatoPesos } from "@/lib/formato";
import { desplazar, etiquetaPeriodo, leerPeriodo, variacion } from "@/lib/periodos";
import { obtenerResumenGeneral } from "@/lib/reportes";
import { rutaReporte, rutaResumenGeneral } from "@/lib/rutas-reportes";

export const metadata = { title: "Resumen general" };

export default async function ResumenGeneral({ searchParams }: PageProps<"/reportes/general">) {
  await requireUsuario(["admin"]);
  const parametros = await searchParams;
  const periodo = leerPeriodo(parametros.tipo, parametros.fecha);
  const [r, anterior] = await Promise.all([obtenerResumenGeneral(periodo), obtenerResumenGeneral(desplazar(periodo, -1))]);
  const maximo = Math.max(1, ...r.sucursales.map((s) => s.costoCentavos));

  return (
    <>
      <EncabezadoPagina antetitulo="Reportes" titulo="Resumen general" descripcion="Mermas de todas las sucursales en el periodo." />
      <SelectorPeriodo periodo={periodo} href={rutaResumenGeneral} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Indicador
          etiqueta={`Costo total · ${etiquetaPeriodo(periodo)}`}
          valor={formatoPesos(r.costoCentavos)}
          variacion={variacion(r.costoCentavos, anterior.costoCentavos)}
          detalle="vs. periodo anterior"
          destacado
        />
        <Indicador etiqueta="Registros" valor={String(r.registros)} icono="lista" detalle={`${anterior.registros} en el periodo anterior`} />
      </div>

      <Tarjeta titulo="Sucursales" descripcion="Ordenadas por costo de mermas" compacta>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-arena-100 bg-arena-50 text-xs tracking-wide text-arena-500 uppercase">
              <tr>
                <th scope="col" className="px-5 py-2.5 font-medium">Sucursal</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Registros</th>
                <th scope="col" className="px-5 py-2.5 text-right font-medium">Costo</th>
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
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-arena-200 bg-arena-50 font-semibold">
              <tr>
                <th scope="row" className="px-5 py-3">Total</th>
                <td className="cifra px-5 py-3 text-right">{r.registros}</td>
                <td className="cifra px-5 py-3 text-right">{formatoPesos(r.costoCentavos)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Tarjeta>
    </>
  );
}
