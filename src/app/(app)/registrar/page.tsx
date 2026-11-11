import { randomUUID } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { ListaMermas } from "@/components/ListaMermas";
import { estiloBoton } from "@/components/ui/boton";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { db } from "@/db";
import { motivos, productos } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { condicionHistorial, listarMermas, totalesMermas } from "@/lib/consultas-mermas";
import { formatoPesos } from "@/lib/formato";
import { crearPeriodo, hoyLocal } from "@/lib/periodos";
import { FormularioMerma } from "./FormularioMerma";

export const metadata = { title: "Registrar merma" };

export default async function PaginaRegistrar() {
  const usuario = await requireUsuario(ROLES_REGISTRO);
  const hoy = crearPeriodo("dia", hoyLocal());
  const deHoy = condicionHistorial({ sucursalId: usuario.sucursalId!, usuarioId: usuario.id, desde: hoy.desde, hasta: hoy.hasta, estado: "activos" });

  const [listaProductos, listaMotivos, totales, recientes] = await Promise.all([
    db
      .select({ id: productos.id, nombre: productos.nombre, categoria: productos.categoria, unidad: productos.unidad })
      .from(productos)
      .where(eq(productos.activo, true))
      .orderBy(asc(productos.categoria), asc(productos.nombre)),
    db.select({ id: motivos.id, nombre: motivos.nombre }).from(motivos).where(eq(motivos.activo, true)).orderBy(asc(motivos.id)),
    totalesMermas(deHoy),
    listarMermas(deHoy, 1, 6),
  ]);

  return (
    <>
      <EncabezadoPagina
        antetitulo={usuario.sucursalNombre}
        titulo="Registrar merma"
        descripcion="La fecha, la hora, tu nombre y la sucursal se guardan solos."
      />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_26rem]">
        <section aria-label="Formulario de registro" className="rounded-2xl bg-white p-5 shadow-suave ring-1 ring-arena-200/70 sm:p-7">
          <FormularioMerma productos={listaProductos} motivos={listaMotivos} claveEnvio={randomUUID()} />
        </section>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-8">
          <Tarjeta titulo="Tus registros de hoy">
            <p className="flex items-baseline gap-2">
              <span className="cifra text-3xl font-semibold">{totales.registros}</span>
              <span className="text-sm text-arena-500">{totales.registros === 1 ? "registro" : "registros"} ·</span>
              <span className="cifra font-semibold text-frambuesa-700">{formatoPesos(totales.costoCentavos)}</span>
            </p>
            {recientes.filas.length > 0 && (
              <div className="mt-4">
                <ListaMermas mermas={recientes.filas} vacio="" compacta />
              </div>
            )}
          </Tarjeta>
          <Tarjeta titulo="Antes de guardar">
            <ul className="flex list-disc flex-col gap-1.5 pl-4 text-sm text-arena-600 marker:text-frambuesa-400">
              <li>Pesa o mide lo desperdiciado; la unidad depende del producto.</li>
              <li>Si fue derrame o producto dañado, una foto ayuda al gerente a revisarlo.</li>
              <li>¿Te equivocaste? Avisa a tu gerente para cancelar el registro.</li>
            </ul>
            <Link href="/mis-registros" className={`${estiloBoton({ variante: "fantasma", tamano: "sm" })} mt-3 -ml-3`}>
              Ver mis registros
            </Link>
          </Tarjeta>
        </aside>
      </div>
    </>
  );
}
