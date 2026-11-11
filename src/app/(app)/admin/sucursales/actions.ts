"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { sucursales } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { esNombreRepetido, type Resultado } from "@/lib/resultado";

const nombre = z.string().trim().min(2, { message: "Escribe el nombre de la sucursal" }).max(80);
const id = z.coerce.number().int().positive();

async function guardar(operacion: () => Promise<unknown>, ok: string): Promise<Resultado> {
  try {
    await operacion();
  } catch (e) {
    if (esNombreRepetido(e)) return { error: "Ya existe una sucursal con ese nombre" };
    throw e;
  }
  revalidatePath("/admin/sucursales");
  return { ok };
}

export async function crearSucursal(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = nombre.safeParse(datos.get("nombre"));
  if (!r.success) return { error: r.error.issues[0].message };
  return guardar(() => db.insert(sucursales).values({ nombre: r.data }), `Sucursal «${r.data}» creada`);
}

export async function renombrarSucursal(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = z.object({ id, nombre }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  return guardar(
    () => db.update(sucursales).set({ nombre: r.data.nombre }).where(eq(sucursales.id, r.data.id)),
    "Nombre actualizado",
  );
}

export async function cambiarEstadoSucursal(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = z.object({ id, activa: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: "Datos inválidos" };
  // Los usuarios de una sucursal inactiva dejan de entrar en su siguiente petición (ver obtenerUsuario).
  const activa = r.data.activa === "true";
  await db.update(sucursales).set({ activa }).where(eq(sucursales.id, r.data.id));
  revalidatePath("/admin/sucursales");
  return { ok: activa ? "Sucursal reactivada" : "Sucursal desactivada" };
}
