import { asc, count, eq } from "drizzle-orm";
import { Editar } from "@/components/Editar";
import { Estado } from "@/components/Estado";
import { FormularioAccion } from "@/components/FormularioAccion";
import { db } from "@/db";
import { sucursales, usuarios } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { cambiarEstadoSucursal, crearSucursal, renombrarSucursal } from "./actions";

export default async function Sucursales() {
  await requireUsuario(["admin"]);
  const lista = await db
    .select({ id: sucursales.id, nombre: sucursales.nombre, activa: sucursales.activa, personal: count(usuarios.id) })
    .from(sucursales)
    .leftJoin(usuarios, eq(usuarios.sucursalId, sucursales.id))
    .groupBy(sucursales.id)
    .orderBy(asc(sucursales.nombre));

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Sucursales</h1>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold">Nueva sucursal</h2>
        <FormularioAccion accion={crearSucursal} textoBoton="Crear sucursal" reiniciar>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Nombre
            <input name="nombre" required maxLength={80} className="campo" placeholder="Sucursal Cumbres" />
          </label>
        </FormularioAccion>
      </div>

      <ul className="flex flex-col gap-2">
        {lista.map((s) => (
          <li key={s.id} className={`rounded-xl bg-white p-4 ring-1 ring-stone-200 ${s.activa ? "" : "opacity-70"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{s.nombre}</p>
              <Estado activo={s.activa} textoInactivo="Desactivada" />
              <p className="ml-auto text-sm text-stone-500">{s.personal} usuarios</p>
            </div>
            <Editar resumen={`Editar ${s.nombre}`}>
              <FormularioAccion accion={renombrarSucursal} textoBoton="Guardar nombre">
                <input type="hidden" name="id" value={s.id} />
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Nombre
                  <input name="nombre" required maxLength={80} defaultValue={s.nombre} className="campo" />
                </label>
              </FormularioAccion>
              <FormularioAccion
                accion={cambiarEstadoSucursal}
                textoBoton={s.activa ? "Desactivar sucursal" : "Reactivar sucursal"}
              >
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="activa" value={String(!s.activa)} />
                {s.activa && (
                  <p className="text-sm text-stone-600">
                    Su personal ya no podrá entrar. Los registros se conservan.
                  </p>
                )}
              </FormularioAccion>
            </Editar>
          </li>
        ))}
      </ul>
    </section>
  );
}
