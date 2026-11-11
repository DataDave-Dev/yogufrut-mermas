"use server";

import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sesiones, sucursales, usuarios } from "@/db/schema";
import { requireUsuario, type UsuarioSesion } from "@/lib/auth";
import { ROLES } from "@/lib/auth-tipos";
import { puedeGestionarUsuario, rolesAsignables } from "@/lib/permisos";
import { esNombreRepetido, type Resultado } from "@/lib/resultado";

const ROLES_GESTION = ["gerente", "admin"] as const;
const password = z
  .string()
  .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
  .max(200, { message: "Contraseña demasiado larga" });
const nombreCompleto = z.string().trim().min(3, { message: "Escribe el nombre completo" }).max(100);
const id = z.coerce.number().int().positive();
const sucursalId = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().positive().nullable());

const primerError = (e: z.ZodError) => ({ error: e.issues[0].message });

/** Sucursal final según quién asigna: el gerente siempre a la suya; el admin, ninguna para otro admin. */
async function resolverSucursal(
  actor: UsuarioSesion,
  rol: (typeof ROLES)[number],
  pedida: number | null,
): Promise<number | null | string> {
  if (actor.rol === "gerente") return actor.sucursalId;
  if (rol === "admin") return null;
  if (!pedida) return "Selecciona la sucursal";
  const [s] = await db.select({ activa: sucursales.activa }).from(sucursales).where(eq(sucursales.id, pedida));
  if (!s) return "Sucursal no encontrada";
  if (!s.activa) return "La sucursal está desactivada";
  return pedida;
}

/** Usuario objetivo, si el actor puede administrarlo. */
async function objetivoGestionable(actor: UsuarioSesion, usuarioId: number) {
  const [objetivo] = await db
    .select({ id: usuarios.id, rol: usuarios.rol, sucursalId: usuarios.sucursalId })
    .from(usuarios)
    .where(eq(usuarios.id, usuarioId));
  return objetivo && puedeGestionarUsuario(actor, objetivo) ? objetivo : null;
}

export async function crearUsuario(datos: FormData): Promise<Resultado> {
  const actor = await requireUsuario(ROLES_GESTION);
  const r = z
    .object({
      usuario: z
        .string()
        .trim()
        .toLowerCase()
        .regex(/^[a-z0-9._-]{3,30}$/, { message: "Usuario: 3 a 30 letras, números, punto, guion o guion bajo" }),
      nombreCompleto,
      password,
      rol: z.enum(ROLES, { message: "Selecciona el puesto" }),
      sucursalId,
    })
    .safeParse(Object.fromEntries(datos));
  if (!r.success) return primerError(r.error);
  if (!rolesAsignables(actor).includes(r.data.rol)) return { error: "No puedes asignar ese puesto" };

  const sucursal = await resolverSucursal(actor, r.data.rol, r.data.sucursalId);
  if (typeof sucursal === "string") return { error: sucursal };

  try {
    await db.insert(usuarios).values({
      usuario: r.data.usuario,
      nombreCompleto: r.data.nombreCompleto,
      rol: r.data.rol,
      sucursalId: sucursal,
      passwordHash: await hash(r.data.password),
    });
  } catch (e) {
    if (esNombreRepetido(e)) return { error: "Ese nombre de usuario ya existe" };
    throw e;
  }
  revalidatePath("/usuarios");
  return { ok: `Usuario «${r.data.usuario}» creado` };
}

export async function editarUsuario(datos: FormData): Promise<Resultado> {
  const actor = await requireUsuario(ROLES_GESTION);
  const r = z
    .object({ id, nombreCompleto, rol: z.enum(ROLES), sucursalId })
    .safeParse(Object.fromEntries(datos));
  if (!r.success) return primerError(r.error);

  const objetivo = await objetivoGestionable(actor, r.data.id);
  if (!objetivo) return { error: "No puedes modificar este usuario" };
  if (!rolesAsignables(actor).includes(r.data.rol)) return { error: "No puedes asignar ese puesto" };
  if (objetivo.id === actor.id && r.data.rol !== actor.rol) return { error: "No puedes cambiar tu propio puesto" };

  const sucursal = await resolverSucursal(actor, r.data.rol, r.data.sucursalId);
  if (typeof sucursal === "string") return { error: sucursal };

  await db
    .update(usuarios)
    .set({ nombreCompleto: r.data.nombreCompleto, rol: r.data.rol, sucursalId: sucursal })
    .where(eq(usuarios.id, objetivo.id));
  revalidatePath("/usuarios");
  return { ok: "Cambios guardados" };
}

export async function cambiarEstadoUsuario(datos: FormData): Promise<Resultado> {
  const actor = await requireUsuario(ROLES_GESTION);
  const r = z.object({ id, activo: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: "Datos inválidos" };

  const objetivo = await objetivoGestionable(actor, r.data.id);
  if (!objetivo) return { error: "No puedes modificar este usuario" };
  const activo = r.data.activo === "true";
  if (objetivo.id === actor.id && !activo) return { error: "No puedes desactivarte a ti mismo" };

  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ activo }).where(eq(usuarios.id, objetivo.id));
    if (!activo) await tx.delete(sesiones).where(eq(sesiones.usuarioId, objetivo.id));
  });
  revalidatePath("/usuarios");
  return { ok: activo ? "Usuario reactivado" : "Usuario desactivado" };
}

export async function restablecerPassword(datos: FormData): Promise<Resultado> {
  const actor = await requireUsuario(ROLES_GESTION);
  const r = z.object({ id, password }).safeParse(Object.fromEntries(datos));
  if (!r.success) return primerError(r.error);

  const objetivo = await objetivoGestionable(actor, r.data.id);
  if (!objetivo) return { error: "No puedes modificar este usuario" };

  const passwordHash = await hash(r.data.password);
  // Cierra sus sesiones abiertas: solo podrá entrar con la contraseña nueva.
  await db.transaction(async (tx) => {
    await tx.update(usuarios).set({ passwordHash }).where(eq(usuarios.id, objetivo.id));
    await tx.delete(sesiones).where(eq(sesiones.usuarioId, objetivo.id));
  });
  return { ok: "Contraseña actualizada; sus sesiones abiertas se cerraron" };
}
