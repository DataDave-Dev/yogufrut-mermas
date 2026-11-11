import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { motivos, productos } from "@/db/schema";
import { redirect } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { FormularioMerma } from "./FormularioMerma";

export default async function PaginaRegistrar() {
  const usuario = await requireUsuario();
  // El administrador no registra mermas: su inicio es la consulta por sucursal.
  if (usuario.rol === "admin") redirect("/sucursal");

  const [listaProductos, listaMotivos] = await Promise.all([
    db
      .select({ id: productos.id, nombre: productos.nombre, categoria: productos.categoria, unidad: productos.unidad })
      .from(productos)
      .where(eq(productos.activo, true))
      .orderBy(asc(productos.categoria), asc(productos.nombre)),
    db
      .select({ id: motivos.id, nombre: motivos.nombre })
      .from(motivos)
      .where(eq(motivos.activo, true))
      .orderBy(asc(motivos.id)),
  ]);

  return (
    <section className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <h1 className="mb-4 text-xl font-bold">Registrar merma</h1>
      <FormularioMerma productos={listaProductos} motivos={listaMotivos} claveEnvio={randomUUID()} />
    </section>
  );
}
