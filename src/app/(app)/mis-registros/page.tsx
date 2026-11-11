import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { mermas, motivos, productos } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos } from "@/lib/formato";

export default async function MisRegistros() {
  const usuario = await requireUsuario(ROLES_REGISTRO);
  // ponytail: últimos 200 sin paginar; paginar cuando un usuario acumule más.
  const registros = await db
    .select({
      id: mermas.id,
      creadaEn: mermas.creadaEn,
      producto: productos.nombre,
      cantidad: mermas.cantidad,
      unidad: mermas.unidad,
      motivo: motivos.nombre,
      costoTotal: mermas.costoTotal,
      canceladaEn: mermas.canceladaEn,
    })
    .from(mermas)
    .innerJoin(productos, eq(productos.id, mermas.productoId))
    .innerJoin(motivos, eq(motivos.id, mermas.motivoId))
    .where(eq(mermas.usuarioId, usuario.id))
    .orderBy(desc(mermas.creadaEn), desc(mermas.id))
    .limit(200);

  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">Mis registros</h1>
      {registros.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-stone-600 ring-1 ring-stone-200">Aún no has registrado mermas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {registros.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl bg-white p-4 ring-1 ring-stone-200 ${r.canceladaEn ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {r.producto} · {formatoCantidad(r.cantidad)} {r.unidad}
                </p>
                <p className="font-semibold text-rose-700">{formatoPesos(r.costoTotal)}</p>
              </div>
              <p className="text-sm text-stone-600">
                {r.motivo} · {formatoFecha(r.creadaEn)} {formatoHora(r.creadaEn)}
                {r.canceladaEn && <span className="ml-2 font-medium text-red-700">Cancelado</span>}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
