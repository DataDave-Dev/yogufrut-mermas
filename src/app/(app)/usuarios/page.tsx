import { and, asc, eq, inArray } from "drizzle-orm";
import { Estado } from "@/components/Estado";
import { FiltrosCatalogo, PaginacionCatalogo, SinCoincidencias } from "@/components/FiltrosCatalogo";
import { FormularioAccion } from "@/components/FormularioAccion";
import { Campo } from "@/components/ui/Campo";
import { DisenoAdmin, Fila, Filas } from "@/components/ui/DisenoAdmin";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Insignia } from "@/components/ui/Insignia";
import { db } from "@/db";
import { sucursales, usuarios } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import type { Rol } from "@/lib/auth-tipos";
import { condicionCatalogo, leerFiltrosCatalogo, rangoPagina } from "@/lib/filtros-catalogo";
import { PUESTOS } from "@/lib/formato";
import { rolesAsignables } from "@/lib/permisos";
import { cambiarEstadoUsuario, crearUsuario, editarUsuario, restablecerPassword } from "./actions";

export const metadata = { title: "Usuarios" };

type Sucursal = { id: number; nombre: string; activa: boolean };

export default async function Usuarios({ searchParams }: PageProps<"/usuarios">) {
  const actor = await requireUsuario(["gerente", "admin"]);
  const filtros = leerFiltrosCatalogo(await searchParams);
  const { limite, desplazamiento } = rangoPagina(filtros.pagina);
  const roles = rolesAsignables(actor);
  const esAdmin = actor.rol === "admin";

  // El gerente solo ve (y gestiona) empleados y encargados de su sucursal.
  const filtro = and(
    esAdmin ? undefined : and(eq(usuarios.sucursalId, actor.sucursalId!), inArray(usuarios.rol, [...roles])),
    condicionCatalogo(filtros, [usuarios.nombreCompleto, usuarios.usuario], usuarios.activo),
    filtros.rol ? eq(usuarios.rol, filtros.rol) : undefined,
    esAdmin && filtros.sucursal ? eq(usuarios.sucursalId, filtros.sucursal) : undefined,
  );
  const [lista, total, listaSucursales] = await Promise.all([
    db
      .select({
        id: usuarios.id,
        usuario: usuarios.usuario,
        nombreCompleto: usuarios.nombreCompleto,
        rol: usuarios.rol,
        sucursalId: usuarios.sucursalId,
        sucursal: sucursales.nombre,
        activo: usuarios.activo,
      })
      .from(usuarios)
      .leftJoin(sucursales, eq(sucursales.id, usuarios.sucursalId))
      .where(filtro)
      .orderBy(asc(sucursales.nombre), asc(usuarios.nombreCompleto), asc(usuarios.id))
      .limit(limite)
      .offset(desplazamiento),
    db.$count(usuarios, filtro),
    esAdmin
      ? db.select({ id: sucursales.id, nombre: sucursales.nombre, activa: sucursales.activa }).from(sucursales).orderBy(asc(sucursales.nombre))
      : Promise.resolve([] as Sucursal[]),
  ]);

  return (
    <>
      <EncabezadoPagina
        antetitulo="Administración"
        titulo={esAdmin ? "Usuarios" : `Usuarios de ${actor.sucursalNombre}`}
        descripcion={
          esAdmin
            ? "Da de alta al personal de cada sucursal, cambia su puesto o contraseña y desactiva a quien ya no trabaja."
            : "Da de alta a empleados y encargados de tu sucursal y restablece sus contraseñas."
        }
      />
      <DisenoAdmin
        tituloAlta="Nuevo usuario"
        alta={
          <FormularioAccion accion={crearUsuario} textoBoton="Crear usuario" reiniciar>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Texto id="nuevo-nombre" etiqueta="Nombre completo" nombre="nombreCompleto" />
            <Texto id="nuevo-usuario" etiqueta="Usuario" nombre="usuario" autoCapitalize="none" ayuda="Para iniciar sesión, p. ej. «ana.lopez»" />
            <Texto id="nuevo-password" etiqueta="Contraseña inicial" nombre="password" tipo="password" minLength={8} ayuda="Mínimo 8 caracteres" />
            <SelectorRol id="nuevo-rol" roles={roles} />
            {esAdmin && (
              <SelectorSucursal
                id="nuevo-sucursal"
                sucursales={listaSucursales.filter((s) => s.activa)}
                ayuda="Para un administrador general déjala vacía"
              />
            )}
            </div>
          </FormularioAccion>
        }
        tituloLista={`${total} ${total === 1 ? "usuario" : "usuarios"}`}
        lista={
          <>
            <FiltrosCatalogo
              ruta="/usuarios"
              filtros={filtros}
              marcador="Buscar por nombre o usuario…"
              selectores={[
                { nombre: "rol", etiqueta: "Filtrar por puesto", todos: "Todos los puestos", opciones: roles.map((r) => ({ id: r, nombre: PUESTOS[r] })) },
                ...(esAdmin
                  ? [{ nombre: "sucursal" as const, etiqueta: "Filtrar por sucursal", todos: "Todas las sucursales", opciones: listaSucursales }]
                  : []),
              ]}
            />
            {lista.length === 0 ? (
              <SinCoincidencias />
            ) : (
            <Filas>
              {lista.map((u) => {
                const esYo = u.id === actor.id;
                return (
                  <Fila
                    key={u.id}
                    inactiva={!u.activo}
                    editar={u.usuario}
                    resumen={
                      <div className="grid items-center gap-x-6 gap-y-1 md:grid-cols-[minmax(0,1.6fr)_13rem_minmax(0,1fr)]">
                        <div className="min-w-0">
                          <p className={`truncate font-semibold ${u.activo ? "text-arena-900" : "text-arena-500"}`}>
                            {u.nombreCompleto}
                            {esYo && <span className="ml-2 text-xs font-normal text-arena-500">(tú)</span>}
                          </p>
                          <p className="truncate text-sm text-arena-500">{u.usuario}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Insignia tono={u.rol === "admin" ? "acento" : "neutro"}>{PUESTOS[u.rol]}</Insignia>
                          <Estado activo={u.activo} />
                        </div>
                        {esAdmin && <p className="truncate text-sm text-arena-600">{u.sucursal ?? "Todas las sucursales"}</p>}
                      </div>
                    }
                  >
                      <FormularioAccion accion={editarUsuario} textoBoton="Guardar cambios" variante="secundario">
                        <input type="hidden" name="id" value={u.id} />
                        <div className="grid gap-4 sm:grid-cols-2">
                          <Texto id={`nombre-${u.id}`} etiqueta="Nombre completo" nombre="nombreCompleto" valor={u.nombreCompleto} />
                          <SelectorRol id={`rol-${u.id}`} roles={esYo ? [u.rol] : roles} valor={u.rol} />
                          {esAdmin && <SelectorSucursal id={`sucursal-${u.id}`} sucursales={listaSucursales} valor={u.sucursalId} />}
                        </div>
                      </FormularioAccion>
                      <FormularioAccion accion={restablecerPassword} textoBoton="Cambiar contraseña" variante="secundario" reiniciar>
                        <input type="hidden" name="id" value={u.id} />
                        <Texto id={`password-${u.id}`} etiqueta="Nueva contraseña" nombre="password" tipo="password" minLength={8} ayuda="Cierra sus sesiones abiertas" />
                      </FormularioAccion>
                      {!esYo && (
                        <FormularioAccion
                          accion={cambiarEstadoUsuario}
                          textoBoton={u.activo ? "Desactivar usuario" : "Reactivar usuario"}
                          variante={u.activo ? "peligro" : "secundario"}
                        >
                          <input type="hidden" name="id" value={u.id} />
                          <input type="hidden" name="activo" value={String(!u.activo)} />
                        </FormularioAccion>
                      )}
                  </Fila>
                );
              })}
            </Filas>
            )}
            <PaginacionCatalogo ruta="/usuarios" filtros={filtros} total={total} />
          </>
        }
      />
    </>
  );
}

type TextoProps = {
  id: string;
  etiqueta: string;
  nombre: string;
  tipo?: string;
  valor?: string;
  minLength?: number;
  autoCapitalize?: string;
  ayuda?: string;
};

function Texto({ id, etiqueta, nombre, tipo = "text", valor, minLength, autoCapitalize, ayuda }: TextoProps) {
  return (
    <Campo id={id} etiqueta={etiqueta} ayuda={ayuda}>
      <input
        id={id}
        name={nombre}
        type={tipo}
        required
        defaultValue={valor}
        minLength={minLength}
        autoCapitalize={autoCapitalize}
        autoComplete={tipo === "password" ? "new-password" : "off"}
        className="campo"
      />
    </Campo>
  );
}

function SelectorRol({ id, roles, valor }: { id: string; roles: readonly Rol[]; valor?: string }) {
  return (
    <Campo id={id} etiqueta="Puesto">
      <select id={id} name="rol" required defaultValue={valor ?? ""} className="campo">
        {!valor && <option value="">Selecciona…</option>}
        {roles.map((r) => (
          <option key={r} value={r}>
            {PUESTOS[r]}
          </option>
        ))}
      </select>
    </Campo>
  );
}

function SelectorSucursal({ id, sucursales, valor, ayuda }: { id: string; sucursales: Sucursal[]; valor?: number | null; ayuda?: string }) {
  return (
    <Campo id={id} etiqueta="Sucursal" ayuda={ayuda}>
      <select id={id} name="sucursalId" defaultValue={valor ?? ""} className="campo">
        <option value="">— Ninguna (administrador) —</option>
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
            {s.activa ? "" : " (desactivada)"}
          </option>
        ))}
      </select>
    </Campo>
  );
}
