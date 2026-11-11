import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { db } from "@/db";
import { motivos, productos } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { FormularioMerma } from "./FormularioMerma";

export const metadata = { title: "Registrar merma" };

export default async function PaginaRegistrar() {
  const usuario = await requireUsuario(ROLES_REGISTRO);

  const [listaProductos, listaMotivos] = await Promise.all([
    db
      .select({ id: productos.id, nombre: productos.nombre, categoria: productos.categoria, unidad: productos.unidad })
      .from(productos)
      .where(eq(productos.activo, true))
      .orderBy(asc(productos.categoria), asc(productos.nombre)),
    db.select({ id: motivos.id, nombre: motivos.nombre }).from(motivos).where(eq(motivos.activo, true)).orderBy(asc(motivos.id)),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <EncabezadoPagina
        antetitulo={usuario.sucursalNombre}
        titulo="Registrar merma"
        descripcion="La fecha, la hora, tu nombre y la sucursal se guardan solos."
      />
      <section className="rounded-2xl bg-white p-5 shadow-suave ring-1 ring-arena-200/70 sm:p-7">
        <FormularioMerma productos={listaProductos} motivos={listaMotivos} claveEnvio={randomUUID()} />
      </section>
    </div>
  );
}
