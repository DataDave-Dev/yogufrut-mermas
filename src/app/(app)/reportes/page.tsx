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
import { desplazar, etiquetaPeriodo, fechasDelPeriodo, hoyLocal, leerPeriodo, variacion } from "@/lib/periodos";
import { Barras } from "@/components/Barras";
import { barrasDiaSemana, barrasHora, porcentaje } from "@/lib/analisis";
import { GraficaDias } from "@/components/GraficaDias";
import { obtenerReporte } from "@/lib/reportes";
import { condicionHistorial, totalesMermas } from "@/lib/consultas-mermas";
import { rutaExcel, rutaHistorial, rutaImprimir, rutaReporte, rutaResumenGeneral } from "@/lib/rutas-reportes";
import { puedeExportar } from "@/lib/permisos";
import { estiloBoton } from "@/components/ui/boton";

const veces = (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`;

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
  // Promedio sobre los días ya transcurridos del periodo (no sobre el mes completo si va a la mitad).
  const fechas = fechasDelPeriodo(periodo);
  const diasTranscurridos = Math.max(1, fechas.filter((f) => f <= hoyLocal()).length);
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
      <EncabezadoPagina
        antetitulo="Panel de reportes"
        titulo={sucursal.nombre}
        acciones={
          puedeExportar(usuario.rol) && (
            <>
              {/* <a> y no <Link>: es una descarga, no una navegación. */}
              <a href={rutaExcel(periodo.tipo, periodo.inicio, idEnUrl)} download className={estiloBoton({ variante: "secundario" })}>
                <Icono nombre="descarga" className="size-4" /> Descargar Excel
              </a>
              <Link
                href={rutaImprimir(periodo.tipo, periodo.inicio, idEnUrl)}
                target="_blank"
                rel="noopener"
                className={estiloBoton({ variante: "secundario" })}
              >
                <Icono nombre="imprimir" className="size-4" /> Exportar PDF
              </Link>
            </>
          )
        }
      />

      <SelectorPeriodo periodo={periodo} href={(tipo, fecha) => rutaReporte(tipo, fecha, idEnUrl)} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Indicador
          etiqueta={`Costo de mermas · ${etiquetaPeriodo(periodo)}`}
          valor={formatoPesos(r.costoCentavos)}
          variacion={variacion(r.costoCentavos, anterior.costoCentavos)}
          detalle={`vs. ${nombreAnterior}`}
          destacado
        />
        <Indicador etiqueta="Total de registros" valor={String(r.registros)} icono="lista" detalle={`${anterior.registros} el ${nombreAnterior}`} />
        <Indicador
          etiqueta="Costo promedio por registro"
          valor={r.registros ? formatoPesos(Math.round(r.costoCentavos / r.registros)) : "—"}
          icono="reportes"
        />
        {periodo.tipo !== "dia" && (
          <Indicador
            etiqueta="Promedio por día"
            valor={formatoPesos(Math.round(r.costoCentavos / diasTranscurridos))}
            detalle={`${(r.registros / diasTranscurridos).toFixed(1)} registros por día`}
            icono="historial"
          />
        )}
        <Indicador
          etiqueta="Registros cancelados"
          valor={String(r.cancelados.registros)}
          detalle={`${formatoPesos(r.cancelados.costoCentavos)} · ${porcentaje(r.cancelados.registros, r.registros + r.cancelados.registros)} del total`}
          icono="cerrar"
        />
        <Indicador
          etiqueta="Producto con más merma"
          valor={r.productos[0]?.nombre ?? "—"}
          detalle={r.productos[0] ? formatoPesos(r.productos[0].costoCentavos) : undefined}
          icono="producto"
          compacto
        />
      </div>

      {r.registros === 0 ? (
        <EstadoVacio titulo="No hay registros en este periodo." descripcion="Prueba con otro periodo o revisa el historial." icono="reportes" />
      ) : (
        <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
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
          <Ranking
            titulo="Costo por categoría"
            vacio="—"
            filas={r.categorias.map((c) => ({
              clave: c.nombre,
              nombre: c.nombre,
              valor: c.costoCentavos,
              textoValor: formatoPesos(c.costoCentavos),
              detalle: `${veces(c.registros)} · ${porcentaje(c.costoCentavos, r.costoCentavos)} del costo`,
            }))}
          />
          {periodo.tipo !== "dia" && (
            <Barras titulo="Costo por día de la semana" descripcion="Qué días se pierde más" barras={barrasDiaSemana(r.diasSemana)} />
          )}
          <Barras titulo="Costo por hora del día" descripcion="A qué hora se registran las mermas" barras={barrasHora(r.horas)} />
        </div>
      )}
      {r.registros > 0 && periodo.tipo !== "dia" && (
        <GraficaDias
          fechas={fechas}
          dias={r.dias}
          href={(fecha) => `/sucursal?${new URLSearchParams({ ...(idEnUrl ? { sucursal: String(idEnUrl) } : {}), desde: fecha, hasta: fecha })}`}
        />
      )}
    </>
  );
}
