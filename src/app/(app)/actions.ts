"use server";

import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { mermas, motivos, productos } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { calcularCostoTotal } from "@/lib/costo";

const esquema = z.object({
  productoId: z.coerce.number().int().positive({ message: "Selecciona un producto" }),
  motivoId: z.coerce.number().int().positive({ message: "Selecciona un motivo" }),
  cantidad: z
    .string()
    .trim()
    .regex(/^\d{1,7}(\.\d{1,3})?$/, { message: "Cantidad inválida (máximo 3 decimales)" })
    .refine((v) => Number(v) > 0, { message: "La cantidad debe ser mayor a 0" }),
  observaciones: z.string().trim().max(500, { message: "Máximo 500 caracteres" }).optional(),
  claveEnvio: z.uuid(),
});

export type EstadoRegistro = {
  claveEnvio: string;
  errores?: Partial<Record<"productoId" | "motivoId" | "cantidad" | "observaciones" | "general", string>>;
  exito?: { producto: string; cantidad: string; unidad: string; costoTotal: string };
};

export async function registrarMerma(previo: EstadoRegistro, formData: FormData): Promise<EstadoRegistro> {
  // Sucursal, usuario, fecha y costo salen de la sesión y del servidor, nunca del formulario.
  const usuario = await requireUsuario(ROLES_REGISTRO);
  const datos = esquema.safeParse(Object.fromEntries(formData));
  if (!datos.success) {
    const errores: EstadoRegistro["errores"] = {};
    for (const i of datos.error.issues) {
      const campo = String(i.path[0]) as keyof NonNullable<EstadoRegistro["errores"]>;
      errores[campo] ??= i.message;
    }
    return { claveEnvio: previo.claveEnvio, errores };
  }
  const d = datos.data;

  const [producto] = await db
    .select()
    .from(productos)
    .where(and(eq(productos.id, d.productoId), eq(productos.activo, true)));
  const [motivo] = await db
    .select({ id: motivos.id })
    .from(motivos)
    .where(and(eq(motivos.id, d.motivoId), eq(motivos.activo, true)));
  if (!producto) return { claveEnvio: previo.claveEnvio, errores: { productoId: "Producto no disponible" } };
  if (!motivo) return { claveEnvio: previo.claveEnvio, errores: { motivoId: "Motivo no disponible" } };

  const costoTotal = calcularCostoTotal(producto.costoUnitario, d.cantidad);
  // clave_envio única: un doble envío del mismo formulario no crea otro registro.
  await db
    .insert(mermas)
    .values({
      sucursalId: usuario.sucursalId!,
      usuarioId: usuario.id,
      productoId: producto.id,
      motivoId: motivo.id,
      cantidad: d.cantidad,
      unidad: producto.unidad,
      costoUnitario: producto.costoUnitario,
      costoTotal,
      observaciones: d.observaciones || null,
      claveEnvio: d.claveEnvio,
    })
    .onConflictDoNothing({ target: mermas.claveEnvio });

  revalidatePath("/mis-registros");
  return {
    claveEnvio: randomUUID(),
    exito: { producto: producto.nombre, cantidad: d.cantidad, unidad: producto.unidad, costoTotal },
  };
}
