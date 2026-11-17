import { asc, count, eq } from "drizzle-orm";
import { Estado } from "@/components/Estado";
import { FiltrosCatalogo, PaginacionCatalogo, SinCoincidencias } from "@/components/FiltrosCatalogo";
import { FormularioAccion } from "@/components/FormularioAccion";
import { Campo } from "@/components/ui/Campo";
import { DisenoAdmin, Fila, Filas } from "@/components/ui/DisenoAdmin";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Icono } from "@/components/ui/Icono";
import { db } from "@/db";
import { sucursales, usuarios } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { condicionCatalogo, leerFiltrosCatalogo, rangoPagina } from "@/lib/filtros-catalogo";
import { cambiarEstadoSucursal, crearSucursal, renombrarSucursal } from "./actions";

export const metadata = { title: "Sucursales" };

export default async function Sucursales({ searchParams }: PageProps<"/admin/sucursales">) {
  await requireUsuario(["admin"]);
  const filtros = leerFiltrosCatalogo(await searchParams);
  const { limite, desplazamiento } = rangoPagina(filtros.pagina);
  const filtro = condicionCatalogo(filtros, [sucursales.nombre], sucursales.activa);
  const [lista, total] = await Promise.all([
    db
    .select({ id: sucursales.id, nombre: sucursales.nombre, activa: sucursales.activa, personal: count(usuarios.id) })
    .from(sucursales)
    .leftJoin(usuarios, eq(usuarios.sucursalId, sucursales.id))
    .where(filtro)
    .groupBy(sucursales.id)
    .orderBy(asc(sucursales.nombre))
    .limit(limite)
    .offset(desplazamiento),
    db.$count(sucursales, filtro),
  ]);

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
            <Campo id="nueva-sucursal" etiqueta="Nombre" className="max-w-md">
              <input id="nueva-sucursal" name="nombre" required maxLength={80} className="campo" placeholder="Sucursal Cumbres" />
            </Campo>
          </FormularioAccion>
        }
        tituloLista={`${total} ${total === 1 ? "sucursal" : "sucursales"}`}
        lista={
          <>
          <FiltrosCatalogo ruta="/admin/sucursales" filtros={filtros} marcador="Buscar sucursal…" />
          {lista.length === 0 && <SinCoincidencias />}
          <Filas>
            {lista.map((s) => (
              <Fila
                key={s.id}
                inactiva={!s.activa}
                editar={s.nombre}
                resumen={
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="grid size-8 place-items-center rounded-lg bg-arena-100 text-arena-500">
                      <Icono nombre="sucursal" className="size-4" />
                    </span>
                    <p className={`font-semibold ${s.activa ? "text-arena-900" : "text-arena-500"}`}>{s.nombre}</p>
                    <Estado activo={s.activa} textoInactivo="Desactivada" />
                    <p className="cifra ml-auto text-sm text-arena-500">
                      {s.personal} {s.personal === 1 ? "usuario" : "usuarios"}
                    </p>
                  </div>
                }
              >
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
              </Fila>
            ))}
          </Filas>
          <PaginacionCatalogo ruta="/admin/sucursales" filtros={filtros} total={total} />
          </>
        }
      />
    </>
  );
}
