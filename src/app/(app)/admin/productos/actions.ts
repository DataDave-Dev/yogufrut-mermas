"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { productos, UNIDADES } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { decimalAEntero } from "@/lib/costo";
import { esNombreRepetido, type Resultado } from "@/lib/resultado";

const campos = z.object({
  nombre: z.string().trim().min(2, { message: "Escribe el nombre del producto" }).max(80),
  categoria: z.string().trim().min(2, { message: "Escribe la categoría" }).max(50),
  unidad: z.enum(UNIDADES, { message: "Selecciona la unidad" }),
  costoUnitario: z
    .string()
    .trim()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, { message: "Costo inválido (máximo 2 decimales)" })
    .transform((v) => decimalAEntero(v, 2)),
});
type Campos = z.infer<typeof campos>;
const aFila = ({ costoUnitario, ...resto }: Campos) => ({ ...resto, costoUnitarioCentavos: costoUnitario });
const id = z.coerce.number().int().positive();

async function guardar(operacion: () => Promise<unknown>, ok: string): Promise<Resultado> {
  try {
    await operacion();
  } catch (e) {
    if (esNombreRepetido(e)) return { error: "Ya existe un producto con ese nombre" };
    throw e;
  }
  revalidatePath("/admin/productos");
  revalidatePath("/registrar");
  return { ok };
}

export async function crearProducto(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = campos.safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  return guardar(() => db.insert(productos).values(aFila(r.data)), `Producto «${r.data.nombre}» creado`);
}

/** El nuevo costo aplica solo a mermas futuras: cada merma guarda el costo vigente al registrarse. */
export async function editarProducto(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = campos.extend({ id }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: r.error.issues[0].message };
  const { id: productoId, ...valores } = r.data;
  return guardar(() => db.update(productos).set(aFila(valores)).where(eq(productos.id, productoId)), "Cambios guardados");
}

export async function cambiarEstadoProducto(datos: FormData): Promise<Resultado> {
  await requireUsuario(["admin"]);
  const r = z.object({ id, activo: z.enum(["true", "false"]) }).safeParse(Object.fromEntries(datos));
  if (!r.success) return { error: "Datos inválidos" };
  const activo = r.data.activo === "true";
  return guardar(
    () => db.update(productos).set({ activo }).where(eq(productos.id, r.data.id)),
    activo ? "Producto reactivado" : "Producto desactivado",
  );
}
