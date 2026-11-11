import "server-only";
import { and, count, desc, eq, gte, isNotNull, isNull, lt, sql, sum, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db";
import { fotosMerma, mermas, motivos, productos, sucursales, usuarios } from "@/db/schema";

export const POR_PAGINA = 50;

const canceladores = alias(usuarios, "canceladores");

const columnas = {
  id: mermas.id,
  usuarioId: mermas.usuarioId,
  sucursalId: mermas.sucursalId,
  sucursal: sucursales.nombre,
  usuario: usuarios.nombreCompleto,
  rolUsuario: usuarios.rol,
  creadaEn: mermas.creadaEn,
  producto: productos.nombre,
  cantidadMilesimas: mermas.cantidadMilesimas,
  unidad: mermas.unidad,
  costoUnitarioCentavos: mermas.costoUnitarioCentavos,
  costoTotalCentavos: mermas.costoTotalCentavos,
  motivo: motivos.nombre,
  observaciones: mermas.observaciones,
  canceladaEn: mermas.canceladaEn,
  canceladaPor: canceladores.nombreCompleto,
  motivoCancelacion: mermas.motivoCancelacion,
  tieneFoto: sql<boolean>`${fotosMerma.mermaId} is not null`.mapWith(Boolean),
};

function consulta() {
  return db
    .select(columnas)
    .from(mermas)
    .innerJoin(sucursales, eq(sucursales.id, mermas.sucursalId))
    .innerJoin(usuarios, eq(usuarios.id, mermas.usuarioId))
    .innerJoin(productos, eq(productos.id, mermas.productoId))
    .innerJoin(motivos, eq(motivos.id, mermas.motivoId))
    .leftJoin(canceladores, eq(canceladores.id, mermas.canceladaPor))
    .leftJoin(fotosMerma, eq(fotosMerma.mermaId, mermas.id));
}

export type MermaFila = NonNullable<Awaited<ReturnType<typeof obtenerMerma>>>;

export async function obtenerMerma(id: number) {
  const [fila] = await consulta().where(eq(mermas.id, id));
  return fila ?? null;
}

/** Página de registros (más recientes primero) más un indicador de si hay página siguiente. */
export async function listarMermas(filtro: SQL, pagina = 1) {
  const filas = await consulta()
    .where(filtro)
    .orderBy(desc(mermas.creadaEn), desc(mermas.id))
    .limit(POR_PAGINA + 1)
    .offset((pagina - 1) * POR_PAGINA);
  return { filas: filas.slice(0, POR_PAGINA), haySiguiente: filas.length > POR_PAGINA };
}

export type FiltroHistorial = {
  /** Sin sucursal: todas (solo para el administrador). */
  sucursalId?: number;
  desde?: number;
  hasta?: number;
  productoId?: number;
  motivoId?: number;
  usuarioId?: number;
  estado: "activos" | "cancelados" | "todos";
};

/** Condición SQL del historial. Quien llama decide la sucursal según el rol del usuario. */
export function condicionHistorial(f: FiltroHistorial): SQL {
  return and(
    f.sucursalId ? eq(mermas.sucursalId, f.sucursalId) : undefined,
    f.desde !== undefined ? gte(mermas.creadaEn, new Date(f.desde)) : undefined,
    f.hasta !== undefined ? lt(mermas.creadaEn, new Date(f.hasta)) : undefined,
    f.productoId ? eq(mermas.productoId, f.productoId) : undefined,
    f.motivoId ? eq(mermas.motivoId, f.motivoId) : undefined,
    f.usuarioId ? eq(mermas.usuarioId, f.usuarioId) : undefined,
    f.estado === "activos" ? isNull(mermas.canceladaEn) : f.estado === "cancelados" ? isNotNull(mermas.canceladaEn) : undefined,
  )!;
}

/** Totales de todo el resultado (no solo la página). El costo excluye cancelados. */
export async function totalesMermas(condicion: SQL) {
  const [fila] = await db
    .select({
      registros: count(),
      costoCentavos: sum(sql`case when ${mermas.canceladaEn} is null then ${mermas.costoTotalCentavos} else 0 end`).mapWith(Number),
    })
    .from(mermas)
    .where(condicion);
  return { registros: fila?.registros ?? 0, costoCentavos: fila?.costoCentavos ?? 0 };
}
