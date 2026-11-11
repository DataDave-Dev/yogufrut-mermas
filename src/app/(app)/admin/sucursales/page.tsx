import { asc, count, eq } from "drizzle-orm";
import { Editar } from "@/components/Editar";
import { Estado } from "@/components/Estado";
import { FormularioAccion } from "@/components/FormularioAccion";
import { Campo } from "@/components/ui/Campo";
import { DisenoAdmin, Fila, Filas } from "@/components/ui/DisenoAdmin";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Icono } from "@/components/ui/Icono";
import { db } from "@/db";
import { sucursales, usuarios } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { cambiarEstadoSucursal, crearSucursal, renombrarSucursal } from "./actions";

export const metadata = { title: "Sucursales" };

export default async function Sucursales() {
  await requireUsuario(["admin"]);
  const lista = await db
    .select({ id: sucursales.id, nombre: sucursales.nombre, activa: sucursales.activa, personal: count(usuarios.id) })
    .from(sucursales)
    .leftJoin(usuarios, eq(usuarios.sucursalId, sucursales.id))
    .groupBy(sucursales.id)
    .orderBy(asc(sucursales.nombre));

  return (
    <>
      <EncabezadoPagina
        antetitulo="Administración"
        titulo="Sucursales"
        descripcion="Al desactivar una sucursal su personal deja de entrar; sus registros se conservan."
      />
      <DisenoAdmin
        tituloAlta="Nueva sucursal"
        alta={
          <FormularioAccion accion={crearSucursal} textoBoton="Crear sucursal" reiniciar>
            <Campo id="nueva-sucursal" etiqueta="Nombre">
              <input id="nueva-sucursal" name="nombre" required maxLength={80} className="campo" placeholder="Sucursal Cumbres" />
            </Campo>
          </FormularioAccion>
        }
        tituloLista={`${lista.length} ${lista.length === 1 ? "sucursal" : "sucursales"}`}
        lista={
          <Filas>
            {lista.map((s) => (
              <Fila key={s.id} inactiva={!s.activa}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="grid size-9 place-items-center rounded-xl bg-arena-100 text-arena-500">
                    <Icono nombre="sucursal" className="size-4" />
                  </span>
                  <p className={`font-semibold ${s.activa ? "text-arena-900" : "text-arena-500"}`}>{s.nombre}</p>
                  <Estado activo={s.activa} textoInactivo="Desactivada" />
                  <p className="ml-auto text-sm text-arena-500">
                    {s.personal} {s.personal === 1 ? "usuario" : "usuarios"}
                  </p>
                </div>
                <Editar resumen={`Editar ${s.nombre}`}>
                  <FormularioAccion accion={renombrarSucursal} textoBoton="Guardar nombre" variante="secundario">
                    <input type="hidden" name="id" value={s.id} />
                    <Campo id={`sucursal-${s.id}`} etiqueta="Nombre">
                      <input id={`sucursal-${s.id}`} name="nombre" required maxLength={80} defaultValue={s.nombre} className="campo" />
                    </Campo>
                  </FormularioAccion>
                  <FormularioAccion
                    accion={cambiarEstadoSucursal}
                    textoBoton={s.activa ? "Desactivar sucursal" : "Reactivar sucursal"}
                    variante={s.activa ? "peligro" : "secundario"}
                  >
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="activa" value={String(!s.activa)} />
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
