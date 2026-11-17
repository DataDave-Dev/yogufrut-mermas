import { notFound, redirect } from "next/navigation";
import { CifrasResumen, HojaImpresion, TablaResumen } from "@/components/HojaImpresion";
import { sucursalDelReporte } from "@/lib/acceso-reportes";
import { requireUsuario } from "@/lib/auth";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos, PUESTOS } from "@/lib/formato";
import { etiquetaPeriodo, leerPeriodo } from "@/lib/periodos";
import { puedeExportar } from "@/lib/permisos";
import { obtenerExportacion } from "@/lib/reportes";
import { porcentaje } from "@/lib/analisis";
import { rutaReporte } from "@/lib/rutas-reportes";

export const metadata = { title: "Reporte para imprimir" };

const veces = (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`;

export default async function ReporteImprimible({ searchParams }: PageProps<"/reportes/imprimir">) {
  const usuario = await requireUsuario();
  if (!puedeExportar(usuario.rol)) redirect("/sin-acceso");
  const parametros = await searchParams;
  const sucursal = await sucursalDelReporte(usuario, parametros.sucursal);
  if (!sucursal) notFound();

  const periodo = leerPeriodo(parametros.tipo, parametros.fecha);
  const datos = await obtenerExportacion(sucursal.id, periodo);

  return (
    <HojaImpresion
      titulo={sucursal.nombre}
      subtitulo={etiquetaPeriodo(periodo)}
      autor={usuario.nombreCompleto}
      volver={rutaReporte(periodo.tipo, periodo.inicio, usuario.rol === "admin" ? sucursal.id : undefined)}
      automatico={parametros.imprimir === "1"}
    >
        <CifrasResumen
          cifras={[
            { etiqueta: "Costo de mermas", valor: formatoPesos(datos.costoCentavos), destacada: true },
            { etiqueta: "Registros", valor: String(datos.registrosTotales) },
            { etiqueta: "Costo promedio por registro", valor: datos.registrosTotales ? formatoPesos(Math.round(datos.costoCentavos / datos.registrosTotales)) : "—" },
          ]}
        />

        {datos.registrosTotales === 0 ? (
          <p className="mt-8 text-arena-600">No hay registros en este periodo.</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-6">
              <TablaResumen
                titulo="Productos con más merma"
                columnas={["Producto", "Registros", "Costo"]}
                filas={datos.productos.map((p) => [`${p.nombre} (${formatoCantidad(p.cantidadMilesimas)} ${p.unidad})`, String(p.registros), formatoPesos(p.costoCentavos)])}
              />
              <div className="flex flex-col gap-6">
                <TablaResumen
                  titulo="Motivos"
                  columnas={["Motivo", "Registros", "Costo"]}
                  filas={datos.motivos.map((m) => [m.nombre, String(m.registros), formatoPesos(m.costoCentavos)])}
                />
                <TablaResumen
                  titulo="Por categoría"
                  columnas={["Categoría", "Registros", "Costo", "%"]}
                  filas={(datos.categorias ?? []).map((c) => [c.nombre, String(c.registros), formatoPesos(c.costoCentavos), porcentaje(c.costoCentavos, datos.costoCentavos)])}
                />
                <TablaResumen
                  titulo="Por empleado"
                  columnas={["Empleado", "Registros", "Costo"]}
                  filas={datos.empleados.map((e) => [`${e.nombre} · ${PUESTOS[e.rol]}`, String(e.registros), formatoPesos(e.costoCentavos)])}
                />
              </div>
            </div>

            <section className="mt-8">
              <h2 className="mb-2 font-display text-base font-semibold">Registros del periodo</h2>
              {datos.truncado && (
                <p className="mb-2 text-xs text-miel-700">Se muestran los {datos.registros.length} registros más recientes de {datos.registrosTotales}.</p>
              )}
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-arena-300 text-xs text-arena-500">
                    <th className="py-1.5 pr-2 font-medium">Fecha</th>
                    <th className="py-1.5 pr-2 font-medium">Registró</th>
                    <th className="py-1.5 pr-2 font-medium">Producto</th>
                    <th className="py-1.5 pr-2 text-right font-medium">Cantidad</th>
                    <th className="py-1.5 pr-2 font-medium">Motivo</th>
                    <th className="py-1.5 text-right font-medium">Costo</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.registros.map((r, i) => (
                    <tr key={i} className="border-b border-arena-100 align-top print:break-inside-avoid">
                      <td className="py-1.5 pr-2 whitespace-nowrap">
                        {formatoFecha(r.creadaEn)} <span className="text-arena-500">{formatoHora(r.creadaEn)}</span>
                      </td>
                      <td className="py-1.5 pr-2">{r.usuario}</td>
                      <td className="py-1.5 pr-2">
                        {r.producto}
                        {r.observaciones && <span className="block text-xs text-arena-500">{r.observaciones}</span>}
                      </td>
                      <td className="cifra py-1.5 pr-2 text-right whitespace-nowrap">
                        {formatoCantidad(r.cantidadMilesimas)} {r.unidad}
                      </td>
                      <td className="py-1.5 pr-2">{r.motivo}</td>
                      <td className="cifra py-1.5 text-right whitespace-nowrap">{formatoPesos(r.costoTotalCentavos)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={5} className="pt-2 text-right">
                      Total · {veces(datos.registrosTotales)}
                    </td>
                    <td className="cifra pt-2 text-right">{formatoPesos(datos.costoCentavos)}</td>
                  </tr>
                </tfoot>
              </table>
            </section>
          </>
        )}
    </HojaImpresion>
  );
}
