import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sucursales } from "@/db/schema";
import type { UsuarioSesion } from "./auth";

/**
 * Sucursal del reporte según quién lo pide: el administrador la elige por parámetro;
 * los demás siempre obtienen la suya (el parámetro se ignora). null si no existe o falta.
 */
export async function sucursalDelReporte(
  usuario: UsuarioSesion,
  parametro: unknown,
): Promise<{ id: number; nombre: string } | null> {
  if (usuario.rol !== "admin") return { id: usuario.sucursalId!, nombre: usuario.sucursalNombre! };
  const id = Number(parametro);
  if (!Number.isInteger(id) || id < 1) return null;
  const [fila] = await db.select({ id: sucursales.id, nombre: sucursales.nombre }).from(sucursales).where(eq(sucursales.id, id));
  return fila ?? null;
}
