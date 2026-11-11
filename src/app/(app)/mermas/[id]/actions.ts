"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { mermas } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { puedeCancelarMerma } from "@/lib/permisos";

const esquema = z.object({
  id: z.coerce.number().int().positive(),
  motivo: z.string().trim().min(3, { message: "Escribe el motivo de la cancelación" }).max(200),
});

export type EstadoCancelacion = { error?: string };

export async function cancelarMerma(_previo: EstadoCancelacion, formData: FormData): Promise<EstadoCancelacion> {
  const usuario = await requireUsuario(["gerente", "admin"]);
  const datos = esquema.safeParse(Object.fromEntries(formData));
  if (!datos.success) return { error: datos.error.issues[0].message };

  const [merma] = await db
    .select({ usuarioId: mermas.usuarioId, sucursalId: mermas.sucursalId, canceladaEn: mermas.canceladaEn })
    .from(mermas)
    .where(eq(mermas.id, datos.data.id));
  if (!merma || !puedeCancelarMerma(usuario, merma)) return { error: "No tienes permiso para cancelar este registro" };
  if (merma.canceladaEn) return { error: "Este registro ya está cancelado" };

  // La condición canceladaEn IS NULL evita cancelar dos veces si dos personas lo hacen a la vez.
  const actualizados = await db
    .update(mermas)
    .set({ canceladaEn: new Date(), canceladaPor: usuario.id, motivoCancelacion: datos.data.motivo })
    .where(and(eq(mermas.id, datos.data.id), isNull(mermas.canceladaEn)))
    .returning({ id: mermas.id });
  if (actualizados.length === 0) return { error: "Este registro ya está cancelado" };

  revalidatePath(`/mermas/${datos.data.id}`);
  revalidatePath("/mis-registros");
  revalidatePath("/sucursal");
  return {};
}
