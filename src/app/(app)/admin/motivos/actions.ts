"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { motivos } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { esNombreRepetido, type Resultado } from "@/lib/resultado";

const nombre = z.string().trim().min(3, { message: "Escribe el motivo" }).max(80);
const id = z.coerce.number().int().positive();

async function guardar(operacion: () => Promise<unknown>, ok: string): Promise<Resultado> {
  try {
    await operacion();
  } catch (e) {
    if (esNombreRepetido(e)) return { error: "Ese motivo ya existe" };
    throw e;
  }
  revalidatePath("/admin/motivos");
  revalidatePath("/registrar");
  return { ok };
}

export async function crearMotivo(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = nombre.safeParse(datos.get("nombre"));
  if (!r.success) return { error: r.error.issues[0].message };
  return guardar(() => db.insert(motivos).values({ nombre: r.data }), `Motivo «${r.data}» creado`);
}

export async function renombrarMotivo(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = z.object({ id, nombre }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  return guardar(() => db.update(motivos).set({ nombre: r.data.nombre }).where(eq(motivos.id, r.data.id)), "Nombre actualizado");
}

export async function cambiarEstadoMotivo(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = z.object({ id, activo: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: "Datos inválidos" };
  const activo = r.data.activo === "true";
  return guardar(
    () => db.update(motivos).set({ activo }).where(eq(motivos.id, r.data.id)),
    activo ? "Motivo reactivado" : "Motivo desactivado",
  );
}
