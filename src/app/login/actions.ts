"use server";

import { hash, verify } from "@node-rs/argon2";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { intentosLogin, sucursales, usuarios } from "@/db/schema";
import { cerrarSesion, crearSesion } from "@/lib/auth";
import { esperaRestanteMs } from "@/lib/intentos-login";

const esquema = z.object({
  usuario: z.string().trim().toLowerCase().min(1).max(50),
  password: z.string().min(1).max(200),
});

const ERROR = "Usuario o contraseña incorrectos";
// Hash real de referencia: el tiempo de respuesta no revela si el usuario existe.
let hashFalso: Promise<string> | undefined;

export type EstadoLogin = { error?: string; usuario?: string };

export async function iniciarSesion(_previo: EstadoLogin, formData: FormData): Promise<EstadoLogin> {
  const usuarioEscrito = String(formData.get("usuario") ?? "").slice(0, 50);
  const datos = esquema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { error: ERROR, usuario: usuarioEscrito };
  const nombre = datos.data.usuario;

  // Freno a fuerza bruta por nombre escrito (exista o no, para no revelar qué usuarios existen).
  const [intentos] = await db.select().from(intentosLogin).where(eq(intentosLogin.usuario, nombre));
  const espera = intentos ? esperaRestanteMs(intentos.fallidos, intentos.ultimoFallo, new Date()) : 0;
  if (espera > 0) {
    return {
      error: `Demasiados intentos fallidos. Espera ${Math.ceil(espera / 1000)} segundos.`,
      usuario: usuarioEscrito,
    };
  }

  const [usuario] = await db
    .select({ id: usuarios.id, passwordHash: usuarios.passwordHash })
    .from(usuarios)
    .leftJoin(sucursales, eq(sucursales.id, usuarios.sucursalId))
    .where(
      and(
        eq(usuarios.usuario, nombre),
        eq(usuarios.activo, true),
        or(isNull(usuarios.sucursalId), eq(sucursales.activa, true)),
      ),
    );

  const hashAComparar = usuario?.passwordHash ?? (await (hashFalso ??= hash("sin-usuario")));
  const valido = await verify(hashAComparar, datos.data.password).catch(() => false);
  if (!usuario || !valido) {
    await db
      .insert(intentosLogin)
      .values({ usuario: nombre, fallidos: 1 })
      .onConflictDoUpdate({
        target: intentosLogin.usuario,
        set: { fallidos: sql`${intentosLogin.fallidos} + 1`, ultimoFallo: new Date() },
      });
    return { error: ERROR, usuario: usuarioEscrito };
  }

  if (intentos) await db.delete(intentosLogin).where(eq(intentosLogin.usuario, nombre));
  await crearSesion(usuario.id);
  redirect("/");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
