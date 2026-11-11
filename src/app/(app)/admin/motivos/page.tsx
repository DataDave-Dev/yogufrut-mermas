import { asc } from "drizzle-orm";
import { Editar } from "@/components/Editar";
import { Estado } from "@/components/Estado";
import { FormularioAccion } from "@/components/FormularioAccion";
import { db } from "@/db";
import { motivos } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { cambiarEstadoMotivo, crearMotivo, renombrarMotivo } from "./actions";

export default async function Motivos() {
  await requireUsuario(["admin"]);
  const lista = await db.select().from(motivos).orderBy(asc(motivos.id));

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Motivos de merma</h1>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold">Nuevo motivo</h2>
        <FormularioAccion accion={crearMotivo} textoBoton="Crear motivo" reiniciar>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Motivo
            <input name="nombre" required maxLength={80} className="campo" />
          </label>
        </FormularioAccion>
      </div>

      <ul className="flex flex-col gap-2">
        {lista.map((m) => (
          <li key={m.id} className={`rounded-xl bg-white p-4 ring-1 ring-stone-200 ${m.activo ? "" : "opacity-70"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">{m.nombre}</p>
              <Estado activo={m.activo} />
            </div>
            <Editar resumen={`Editar ${m.nombre}`}>
              <FormularioAccion accion={renombrarMotivo} textoBoton="Guardar nombre">
                <input type="hidden" name="id" value={m.id} />
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Motivo
                  <input name="nombre" required maxLength={80} defaultValue={m.nombre} className="campo" />
                </label>
              </FormularioAccion>
              <FormularioAccion
                accion={cambiarEstadoMotivo}
                textoBoton={m.activo ? "Desactivar motivo" : "Reactivar motivo"}
              >
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="activo" value={String(!m.activo)} />
              </FormularioAccion>
            </Editar>
          </li>
        ))}
      </ul>
    </section>
  );
}
