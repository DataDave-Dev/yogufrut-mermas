import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { fotosMerma, mermas } from "@/db/schema";
import { obtenerUsuario } from "@/lib/auth";
import { puedeVerMerma } from "@/lib/permisos";

export async function GET(_req: NextRequest, ctx: RouteContext<"/mermas/[id]/foto">) {
  const usuario = await obtenerUsuario();
  if (!usuario) return new Response("No autenticado", { status: 401 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id < 1) return new Response("No encontrado", { status: 404 });

  const [fila] = await db
    .select({
      usuarioId: mermas.usuarioId,
      sucursalId: mermas.sucursalId,
      tipoMime: fotosMerma.tipoMime,
      bytes: fotosMerma.bytes,
    })
    .from(fotosMerma)
    .innerJoin(mermas, eq(mermas.id, fotosMerma.mermaId))
    .where(eq(fotosMerma.mermaId, id));
  // Misma respuesta si no existe o no tiene permiso: no revela qué registros existen.
  if (!fila || !puedeVerMerma(usuario, fila)) return new Response("No encontrado", { status: 404 });

  return new Response(new Uint8Array(fila.bytes), {
    headers: {
      "Content-Type": fila.tipoMime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
