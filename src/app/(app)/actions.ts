"use server";

import { and, eq, gt, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { fotosMerma, mermas, motivos, productos } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { costoTotalCentavos, decimalAEntero } from "@/lib/costo";
import { detectarTipoFoto, FOTO_MAX_BYTES } from "@/lib/foto";

const VENTANA_DUPLICADO_MS = 5 * 60 * 1000;

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
  confirmarDuplicado: z.literal("1").optional(),
});

type CampoError = "productoId" | "motivoId" | "cantidad" | "observaciones" | "foto";

export type EstadoRegistro = {
  claveEnvio: string;
  errores?: Partial<Record<CampoError, string>>;
  /** Hay un registro igual reciente: la UI pide confirmar antes de guardar. */
  duplicado?: boolean;
  exito?: { producto: string; cantidadMilesimas: number; unidad: string; costoTotalCentavos: number };
};

async function leerFoto(valor: FormDataEntryValue | null): Promise<{ tipo: string; bytes: Buffer } | string | null> {
  if (!(valor instanceof File) || valor.size === 0) return null;
  if (valor.size > FOTO_MAX_BYTES) return "La foto debe pesar 5 MB o menos";
  const bytes = Buffer.from(await valor.arrayBuffer());
  const tipo = detectarTipoFoto(bytes);
  return tipo ? { tipo, bytes } : "La foto debe ser JPEG, PNG o WebP";
}

export async function registrarMerma(previo: EstadoRegistro, formData: FormData): Promise<EstadoRegistro> {
  // Sucursal, usuario, fecha y costo salen de la sesión y del servidor, nunca del formulario.
  const usuario = await requireUsuario(ROLES_REGISTRO);
  const falla = (errores: EstadoRegistro["errores"]) => ({ claveEnvio: previo.claveEnvio, errores });

  const { foto: fotoEnviada, ...campos } = Object.fromEntries(formData);
  const datos = esquema.safeParse(campos);
  const foto = await leerFoto(fotoEnviada ?? null);
  if (!datos.success || typeof foto === "string") {
    const errores: NonNullable<EstadoRegistro["errores"]> = {};
    for (const i of datos.error?.issues ?? []) errores[String(i.path[0]) as CampoError] ??= i.message;
    if (typeof foto === "string") errores.foto = foto;
    return falla(errores);
  }
  const d = datos.data;
  const cantidadMilesimas = decimalAEntero(d.cantidad, 3);

  const [producto] = await db
    .select()
    .from(productos)
    .where(and(eq(productos.id, d.productoId), eq(productos.activo, true)));
  const [motivo] = await db
    .select({ id: motivos.id })
    .from(motivos)
    .where(and(eq(motivos.id, d.motivoId), eq(motivos.activo, true)));
  if (!producto) return falla({ productoId: "Producto no disponible" });
  if (!motivo) return falla({ motivoId: "Motivo no disponible" });

  if (!d.confirmarDuplicado) {
    const [reciente] = await db
      .select({ id: mermas.id })
      .from(mermas)
      .where(
        and(
          eq(mermas.usuarioId, usuario.id),
          eq(mermas.productoId, producto.id),
          eq(mermas.cantidadMilesimas, cantidadMilesimas),
          isNull(mermas.canceladaEn),
          gt(mermas.creadaEn, new Date(Date.now() - VENTANA_DUPLICADO_MS)),
        ),
      )
      .limit(1);
    if (reciente) return { claveEnvio: previo.claveEnvio, duplicado: true };
  }

  const costoTotal = costoTotalCentavos(producto.costoUnitarioCentavos, cantidadMilesimas);
  await db.transaction(async (tx) => {
    // clave_envio única: un doble envío del mismo formulario no crea otro registro.
    const [nueva] = await tx
      .insert(mermas)
      .values({
        sucursalId: usuario.sucursalId!,
        usuarioId: usuario.id,
        productoId: producto.id,
        motivoId: motivo.id,
        cantidadMilesimas,
        unidad: producto.unidad,
        costoUnitarioCentavos: producto.costoUnitarioCentavos,
        costoTotalCentavos: costoTotal,
        observaciones: d.observaciones || null,
        claveEnvio: d.claveEnvio,
      })
      .onConflictDoNothing({ target: mermas.claveEnvio })
      .returning({ id: mermas.id });
    if (nueva && foto) {
      await tx.insert(fotosMerma).values({ mermaId: nueva.id, tipoMime: foto.tipo, bytes: foto.bytes });
    }
  });

  revalidatePath("/mis-registros");
  revalidatePath("/sucursal");
  return {
    claveEnvio: randomUUID(),
    exito: {
      producto: producto.nombre,
      cantidadMilesimas,
      unidad: producto.unidad,
      costoTotalCentavos: costoTotal,
    },
  };
}
