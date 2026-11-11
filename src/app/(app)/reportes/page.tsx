import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Ranking } from "@/components/Ranking";
import { SelectorPeriodo } from "@/components/SelectorPeriodo";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { Icono } from "@/components/ui/Icono";
import { Indicador } from "@/components/ui/Indicador";
import { db } from "@/db";
import { sucursales } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { formatoCantidad, formatoPesos, PUESTOS } from "@/lib/formato";
import { desplazar, etiquetaPeriodo, leerPeriodo, variacion } from "@/lib/periodos";
import { obtenerReporte } from "@/lib/reportes";
import { condicionHistorial, totalesMermas } from "@/lib/consultas-mermas";
import { rutaHistorial, rutaReporte, rutaResumenGeneral } from "@/lib/rutas-reportes";

const veces = (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`;
const dma = (fecha: string) => fecha.split("-").reverse().join("/");

export const metadata = { title: "Reportes" };

export default async function Reportes({ searchParams }: PageProps<"/reportes">) {
  const usuario = await requireUsuario(["encargado", "gerente", "admin"]);
  const parametros = await searchParams;
  const periodo = leerPeriodo(parametros.tipo, parametros.fecha);
  const esAdmin = usuario.rol === "admin";

  // El administrador entra por el resumen general; los demás, siempre a su sucursal.
  let sucursal = { id: usuario.sucursalId!, nombre: usuario.sucursalNombre! };
  if (esAdmin) {
    const id = Number(parametros.sucursal);
    if (!Number.isInteger(id) || id < 1) redirect(rutaResumenGeneral(periodo.tipo, periodo.inicio));
    const [fila] = await db.select({ id: sucursales.id, nombre: sucursales.nombre }).from(sucursales).where(eq(sucursales.id, id));
    if (!fila) notFound();
    sucursal = fila;
  }
  const idEnUrl = esAdmin ? sucursal.id : undefined;
  const anteriorPeriodo = desplazar(periodo, -1);
  const [r, anterior] = await Promise.all([
    obtenerReporte(sucursal.id, periodo),
    totalesMermas(condicionHistorial({ sucursalId: sucursal.id, desde: anteriorPeriodo.desde, hasta: anteriorPeriodo.hasta, estado: "activos" })),
  ]);
  const nombreAnterior = { dia: "día anterior", semana: "semana anterior", mes: "mes anterior" }[periodo.tipo];
  const historial = (filtros: Parameters<typeof rutaHistorial>[1]) => rutaHistorial(periodo, { ...filtros, sucursal: idEnUrl });

  return (
    <>
      {esAdmin && (
        <Link
          href={rutaResumenGeneral(periodo.tipo, periodo.inicio)}
          className="-mb-2 inline-flex w-fit items-center gap-1 text-sm font-medium text-arena-600 hover:text-arena-900"
        >
          <Icono nombre="izquierda" className="size-4" /> Resumen general
        </Link>
      )}
      <EncabezadoPagina antetitulo="Panel de reportes" titulo={sucursal.nombre} />

      <SelectorPeriodo periodo={periodo} href={(tipo, fecha) => rutaReporte(tipo, fecha, idEnUrl)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Indicador
          etiqueta={`Costo de mermas · ${etiquetaPeriodo(periodo)}`}
          valor={formatoPesos(r.costoCentavos)}
          variacion={variacion(r.costoCentavos, anterior.costoCentavos)}
          detalle={`vs. ${nombreAnterior}`}
          destacado
        />
        <Indicador etiqueta="Total de registros" valor={String(r.registros)} icono="lista" detalle={`${anterior.registros} el ${nombreAnterior}`} />
      </div>

      {r.registros === 0 ? (
        <EstadoVacio titulo="No hay registros en este periodo." descripcion="Prueba con otro periodo o revisa el historial." icono="reportes" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <Ranking
            titulo="Productos con más merma"
            vacio="—"
            filas={r.productos.map((p) => ({
              clave: `${p.id}-${p.unidad}`,
              nombre: p.nombre,
              valor: p.costoCentavos,
              textoValor: formatoPesos(p.costoCentavos),
              detalle: `${veces(p.registros)} · ${formatoCantidad(p.cantidadMilesimas)} ${p.unidad}`,
              href: historial({ producto: p.id }),
            }))}
          />
          <Ranking
            titulo="Motivos más frecuentes"
            vacio="—"
            filas={r.motivos.map((m) => ({
              clave: m.id,
              nombre: m.nombre,
              valor: m.registros,
              textoValor: veces(m.registros),
              detalle: formatoPesos(m.costoCentavos),
              href: historial({ motivo: m.id }),
            }))}
          />
          <Ranking
            titulo="Registros por empleado"
            vacio="—"
            filas={r.empleados.map((e) => ({
              clave: e.id,
              nombre: e.nombre,
              valor: e.costoCentavos,
              textoValor: formatoPesos(e.costoCentavos),
              detalle: `${veces(e.registros)} · ${PUESTOS[e.rol]}`,
              href: historial({ usuario: e.id }),
            }))}
          />
          {periodo.tipo !== "dia" && (
            <Ranking
              titulo="Por día"
              vacio="—"
              filas={r.dias.map((d) => ({
                clave: d.fecha,
                nombre: dma(d.fecha),
                valor: d.costoCentavos,
                textoValor: formatoPesos(d.costoCentavos),
                detalle: veces(d.registros),
                href: `/sucursal?${new URLSearchParams({ ...(idEnUrl ? { sucursal: String(idEnUrl) } : {}), desde: d.fecha, hasta: d.fecha })}`,
              }))}
            />
          )}
        </div>
      )}
    </>
  );
}
