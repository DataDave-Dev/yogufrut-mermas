import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { estiloBoton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/Icono";
import { sucursalDelReporte } from "@/lib/acceso-reportes";
import { requireUsuario } from "@/lib/auth";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos, PUESTOS } from "@/lib/formato";
import { etiquetaPeriodo, leerPeriodo } from "@/lib/periodos";
import { puedeExportar } from "@/lib/permisos";
import { obtenerExportacion } from "@/lib/reportes";
import { rutaReporte } from "@/lib/rutas-reportes";
import { ImprimirAlCargar } from "./ImprimirAlCargar";

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
  const generado = new Date();

  return (
    <div className="bg-white print:bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-arena-200 bg-arena-50/90 px-6 py-3 backdrop-blur print:hidden">
        <Link
          href={rutaReporte(periodo.tipo, periodo.inicio, usuario.rol === "admin" ? sucursal.id : undefined)}
          className={estiloBoton({ variante: "fantasma" })}
        >
          <Icono nombre="izquierda" className="size-4" /> Volver al panel
        </Link>
        <ImprimirAlCargar automatico={parametros.imprimir === "1"} />
      </div>

      <main id="contenido" className="mx-auto max-w-[52rem] px-8 py-10 text-[13px] text-arena-900 print:max-w-none print:p-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-frambuesa-700 pb-4">
          <div>
            <p className="font-display text-sm font-semibold text-frambuesa-700">Yogufrut · Reporte de mermas</p>
            <h1 className="font-display text-2xl font-semibold">{sucursal.nombre}</h1>
            <p className="mt-0.5 text-arena-600 first-letter:uppercase">{etiquetaPeriodo(periodo)}</p>
          </div>
          <p className="text-right text-xs text-arena-500">
            Generado el {formatoFecha(generado)}
            <br />
            {formatoHora(generado)} por {usuario.nombreCompleto}
          </p>
        </header>

        <section aria-label="Resumen" className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-arena-200 p-4">
            <p className="text-arena-500">Costo de mermas</p>
            <p className="cifra text-2xl font-semibold text-frambuesa-700">{formatoPesos(datos.costoCentavos)}</p>
          </div>
          <div className="rounded-lg border border-arena-200 p-4">
            <p className="text-arena-500">Registros</p>
            <p className="cifra text-2xl font-semibold">{datos.registrosTotales}</p>
          </div>
        </section>

        {datos.registrosTotales === 0 ? (
          <p className="mt-8 text-arena-600">No hay registros en este periodo.</p>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-6 print:break-inside-avoid">
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
      </main>
    </div>
  );
}

function TablaResumen({ titulo, columnas, filas }: { titulo: string; columnas: string[]; filas: string[][] }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-semibold">{titulo}</h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-arena-300 text-xs text-arena-500">
            {columnas.map((c, i) => (
              <th key={c} className={`py-1 font-medium ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f[0]} className="border-b border-arena-100">
              {f.map((celda, i) => (
                <td key={i} className={`py-1 ${i > 0 ? "cifra text-right" : ""}`}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
