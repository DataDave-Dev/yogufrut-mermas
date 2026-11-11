import "server-only";
import { desc, eq, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
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
  cantidad: mermas.cantidad,
  unidad: mermas.unidad,
  costoUnitario: mermas.costoUnitario,
  costoTotal: mermas.costoTotal,
  motivo: motivos.nombre,
  observaciones: mermas.observaciones,
  canceladaEn: mermas.canceladaEn,
  canceladaPor: canceladores.nombreCompleto,
  motivoCancelacion: mermas.motivoCancelacion,
  tieneFoto: sql<boolean>`${fotosMerma.mermaId} is not null`,
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
