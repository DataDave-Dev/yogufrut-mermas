import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/db";
import { sesiones, sucursales, usuarios } from "@/db/schema";
import { sesionVigente } from "./reglas-sesion";

const COOKIE = "yogufrut_sesion";
const RENOVAR_CADA_MS = 60_000;

export type { Rol } from "./auth-tipos";
import type { Rol } from "./auth-tipos";
/** Roles que pertenecen a una sucursal y registran mermas. */
export const ROLES_REGISTRO = ["empleado", "encargado", "gerente"] as const satisfies readonly Rol[];

export type UsuarioSesion = {
  id: number;
  nombreCompleto: string;
  rol: Rol;
  sucursalId: number | null;
  sucursalNombre: string | null;
};

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function crearSesion(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  await db.insert(sesiones).values({ tokenHash: hashToken(token), usuarioId });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}

export async function cerrarSesion() {
  const almacen = await cookies();
  const token = almacen.get(COOKIE)?.value;
  if (token) await db.delete(sesiones).where(eq(sesiones.tokenHash, hashToken(token)));
  almacen.delete(COOKIE);
}

/** Usuario de la sesión actual, o null si no hay sesión válida. Una consulta por petición. */
export const obtenerUsuario = cache(async (): Promise<UsuarioSesion | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const tokenHash = hashToken(token);

  const [fila] = await db
    .select({
      id: usuarios.id,
      nombreCompleto: usuarios.nombreCompleto,
      rol: usuarios.rol,
      sucursalId: usuarios.sucursalId,
      sucursalNombre: sucursales.nombre,
      creadaEn: sesiones.creadaEn,
      ultimoAcceso: sesiones.ultimoAcceso,
    })
    .from(sesiones)
    .innerJoin(usuarios, eq(usuarios.id, sesiones.usuarioId))
    .leftJoin(sucursales, eq(sucursales.id, usuarios.sucursalId))
    .where(
      and(
        eq(sesiones.tokenHash, tokenHash),
        eq(usuarios.activo, true),
        or(isNull(usuarios.sucursalId), eq(sucursales.activa, true)),
      ),
    );
  if (!fila) return null;

  const ahora = new Date();
  if (!sesionVigente(fila.creadaEn, fila.ultimoAcceso, ahora)) {
    await db.delete(sesiones).where(eq(sesiones.tokenHash, tokenHash));
    return null;
  }
  if (ahora.getTime() - fila.ultimoAcceso.getTime() > RENOVAR_CADA_MS) {
    await db.update(sesiones).set({ ultimoAcceso: ahora }).where(eq(sesiones.tokenHash, tokenHash));
  }

  return {
    id: fila.id,
    nombreCompleto: fila.nombreCompleto,
    rol: fila.rol,
    sucursalId: fila.sucursalId,
    sucursalNombre: fila.sucursalNombre,
  };
});

/** Exige sesión (y opcionalmente un rol). Sin sesión redirige al login; rol no permitido → 403. */
export async function requireUsuario(roles?: readonly Rol[]): Promise<UsuarioSesion> {
  const usuario = await obtenerUsuario();
  if (!usuario) redirect("/login");
  if (roles && !roles.includes(usuario.rol)) redirect("/sin-acceso");
  return usuario;
}
