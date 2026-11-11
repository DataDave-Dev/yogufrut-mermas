"use server";

import { hash, verify } from "@node-rs/argon2";
import { and, eq, isNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { sucursales, usuarios } from "@/db/schema";
import { cerrarSesion, crearSesion } from "@/lib/auth";

const esquema = z.object({
  usuario: z.string().trim().toLowerCase().min(1).max(50),
  password: z.string().min(1).max(200),
});

const ERROR = "Usuario o contraseña incorrectos";
// Hash real de referencia: el tiempo de respuesta no revela si el usuario existe.
let hashFalso: Promise<string> | undefined;

export async function iniciarSesion(_previo: string | null, formData: FormData): Promise<string | null> {
  const datos = esquema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return ERROR;

  const [usuario] = await db
    .select({ id: usuarios.id, passwordHash: usuarios.passwordHash })
    .from(usuarios)
    .leftJoin(sucursales, eq(sucursales.id, usuarios.sucursalId))
    .where(
      and(
        eq(usuarios.usuario, datos.data.usuario),
        eq(usuarios.activo, true),
        or(isNull(usuarios.sucursalId), eq(sucursales.activa, true)),
      ),
    );

  const valido = await verify(usuario?.passwordHash ?? (await (hashFalso ??= hash("sin-usuario"))), datos.data.password).catch(() => false);
  if (!usuario || !valido) return ERROR;

  await crearSesion(usuario.id);
  redirect("/");
}

export async function salir() {
  await cerrarSesion();
  redirect("/login");
}
