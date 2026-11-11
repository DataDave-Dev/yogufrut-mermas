import "server-only";
import { and, asc, count, desc, eq, gte, isNull, lt, sql, sum, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { mermas, motivos, productos, sucursales, usuarios } from "@/db/schema";
import { condicionHistorial, listarMermas } from "./consultas-mermas";
import type { DatosExportacion } from "./exportacion";
import { desfaseMs, type Periodo } from "./periodos";

const LIMITE_RANKING = 10;

const costo = sum(mermas.costoTotalCentavos).mapWith(Number);
const registros = count();

/** Mermas no canceladas de una sucursal en el periodo. */
function condicionPeriodo(periodo: Periodo, sucursalId?: number): SQL {
  return and(
    sucursalId ? eq(mermas.sucursalId, sucursalId) : undefined,
    gte(mermas.creadaEn, new Date(periodo.desde)),
    lt(mermas.creadaEn, new Date(periodo.hasta)),
    isNull(mermas.canceladaEn),
  )!;
}

/** Datos del panel de una sucursal: totales, rankings y desglose por día. Excluye cancelados. */
export async function obtenerReporte(sucursalId: number, periodo: Periodo, limite = LIMITE_RANKING) {
  const donde = condicionPeriodo(periodo, sucursalId);
  // ponytail: desfase fijo del inicio del periodo; un cambio de horario a mitad del periodo movería
  // una hora el día del cambio (Monterrey no tiene horario de verano desde 2022).
  const desfase = desfaseMs(periodo.desde);
  const dia = sql<string>`strftime('%Y-%m-%d', (${mermas.creadaEn} + ${desfase}) / 1000, 'unixepoch')`;

  const [totales, porProducto, porMotivo, porEmpleado, porDia] = await Promise.all([
    db.select({ registros, costoCentavos: costo }).from(mermas).where(donde),
    db
      .select({
        id: productos.id,
        nombre: productos.nombre,
        unidad: mermas.unidad,
        registros,
        cantidadMilesimas: sum(mermas.cantidadMilesimas).mapWith(Number),
        costoCentavos: costo,
      })
      .from(mermas)
      .innerJoin(productos, eq(productos.id, mermas.productoId))
      .where(donde)
      .groupBy(productos.id, mermas.unidad)
      .orderBy(desc(costo), asc(productos.nombre))
      .limit(limite),
    db
      .select({ id: motivos.id, nombre: motivos.nombre, registros, costoCentavos: costo })
      .from(mermas)
      .innerJoin(motivos, eq(motivos.id, mermas.motivoId))
      .where(donde)
      .groupBy(motivos.id)
      .orderBy(desc(registros), desc(costo))
      .limit(limite),
    db
      .select({ id: usuarios.id, nombre: usuarios.nombreCompleto, rol: usuarios.rol, registros, costoCentavos: costo })
      .from(mermas)
      .innerJoin(usuarios, eq(usuarios.id, mermas.usuarioId))
      .where(donde)
      .groupBy(usuarios.id)
      .orderBy(desc(costo), asc(usuarios.nombreCompleto)),
    db.select({ fecha: dia, registros, costoCentavos: costo }).from(mermas).where(donde).groupBy(dia).orderBy(asc(dia)),
  ]);

  return {
    registros: totales[0]?.registros ?? 0,
    costoCentavos: totales[0]?.costoCentavos ?? 0,
    productos: porProducto,
    motivos: porMotivo,
    empleados: porEmpleado,
    dias: porDia,
  };
}

export type Reporte = Awaited<ReturnType<typeof obtenerReporte>>;

/** Todas las sucursales con sus registros y costo del periodo, más el total general. */
export async function obtenerResumenGeneral(periodo: Periodo) {
  const filas = await db
    .select({
      id: sucursales.id,
      nombre: sucursales.nombre,
      activa: sucursales.activa,
      registros: count(mermas.id),
      costoCentavos: sql<number>`coalesce(sum(${mermas.costoTotalCentavos}), 0)`.mapWith(Number),
    })
    .from(sucursales)
    // El filtro va en el JOIN para conservar las sucursales sin mermas en el periodo.
    .leftJoin(mermas, and(eq(mermas.sucursalId, sucursales.id), condicionPeriodo(periodo)))
    .groupBy(sucursales.id)
    .orderBy(desc(sql`coalesce(sum(${mermas.costoTotalCentavos}), 0)`), asc(sucursales.nombre));

  return {
    sucursales: filas,
    registros: filas.reduce((t, f) => t + f.registros, 0),
    costoCentavos: filas.reduce((t, f) => t + f.costoCentavos, 0),
  };
}

/** Máximo de filas de detalle en una exportación. */
export const LIMITE_EXPORTACION = 10_000;

/** Registros no cancelados del periodo para exportar, más recientes primero. */
export async function obtenerRegistrosDelPeriodo(sucursalId: number, periodo: Periodo) {
  const { filas, haySiguiente } = await listarMermas(
    condicionHistorial({ sucursalId, desde: periodo.desde, hasta: periodo.hasta, estado: "activos" }),
    1,
    LIMITE_EXPORTACION,
  );
  return { registros: filas, truncado: haySiguiente };
}

/** Reporte completo para exportar: todos los productos, motivos y empleados, y el detalle. */
export async function obtenerExportacion(sucursalId: number, periodo: Periodo): Promise<DatosExportacion> {
  const [reporte, detalle] = await Promise.all([
    obtenerReporte(sucursalId, periodo, LIMITE_EXPORTACION),
    obtenerRegistrosDelPeriodo(sucursalId, periodo),
  ]);
  return {
    registros: detalle.registros,
    truncado: detalle.truncado,
    registrosTotales: reporte.registros,
    costoCentavos: reporte.costoCentavos,
    productos: reporte.productos,
    motivos: reporte.motivos,
    empleados: reporte.empleados,
  };
}
