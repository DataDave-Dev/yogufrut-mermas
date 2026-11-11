import { asc } from "drizzle-orm";
import { Editar } from "@/components/Editar";
import { Estado } from "@/components/Estado";
import { FormularioAccion } from "@/components/FormularioAccion";
import { Campo } from "@/components/ui/Campo";
import { DisenoAdmin, Fila, Filas } from "@/components/ui/DisenoAdmin";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { db } from "@/db";
import { motivos } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { cambiarEstadoMotivo, crearMotivo, renombrarMotivo } from "./actions";

export const metadata = { title: "Motivos" };

export default async function Motivos() {
  await requireUsuario(["admin"]);
  const lista = await db.select().from(motivos).orderBy(asc(motivos.id));

  return (
    <>
      <EncabezadoPagina
        antetitulo="Catálogos"
        titulo="Motivos de merma"
        descripcion="Los motivos desactivados dejan de aparecer al registrar; los registros anteriores los conservan."
      />
      <DisenoAdmin
        tituloAlta="Nuevo motivo"
        alta={
          <FormularioAccion accion={crearMotivo} textoBoton="Crear motivo" reiniciar>
            <Campo id="nuevo-motivo" etiqueta="Motivo">
              <input id="nuevo-motivo" name="nombre" required maxLength={80} className="campo" placeholder="Ej. Corte de luz" />
            </Campo>
          </FormularioAccion>
        }
        tituloLista={`${lista.length} motivos`}
        lista={
          <Filas>
            {lista.map((m) => (
              <Fila key={m.id} inactiva={!m.activo}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`font-semibold ${m.activo ? "text-arena-900" : "text-arena-500"}`}>{m.nombre}</p>
                  <Estado activo={m.activo} />
                </div>
                <Editar resumen={`Editar ${m.nombre}`}>
                  <FormularioAccion accion={renombrarMotivo} textoBoton="Guardar nombre" variante="secundario">
                    <input type="hidden" name="id" value={m.id} />
                    <Campo id={`motivo-${m.id}`} etiqueta="Motivo">
                      <input id={`motivo-${m.id}`} name="nombre" required maxLength={80} defaultValue={m.nombre} className="campo" />
                    </Campo>
                  </FormularioAccion>
                  <FormularioAccion
                    accion={cambiarEstadoMotivo}
                    textoBoton={m.activo ? "Desactivar motivo" : "Reactivar motivo"}
                    variante={m.activo ? "peligro" : "secundario"}
                  >
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="activo" value={String(!m.activo)} />
                  </FormularioAccion>
                </Editar>
              </Fila>
            ))}
          </Filas>
        }
      />
    </>
  );
}
