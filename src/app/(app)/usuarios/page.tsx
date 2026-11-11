import { and, asc, eq, inArray, type SQL } from "drizzle-orm";
import { Editar } from "@/components/Editar";
import { Estado } from "@/components/Estado";
import { FormularioAccion } from "@/components/FormularioAccion";
import { db } from "@/db";
import { sucursales, usuarios } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { PUESTOS } from "@/lib/formato";
import { rolesAsignables } from "@/lib/permisos";
import { cambiarEstadoUsuario, crearUsuario, editarUsuario, restablecerPassword } from "./actions";

type Sucursal = { id: number; nombre: string; activa: boolean };

export default async function Usuarios() {
  const actor = await requireUsuario(["gerente", "admin"]);
  const roles = rolesAsignables(actor);
  const esAdmin = actor.rol === "admin";

  // El gerente solo ve (y gestiona) empleados y encargados de su sucursal.
  const filtro: SQL | undefined = esAdmin
    ? undefined
    : and(eq(usuarios.sucursalId, actor.sucursalId!), inArray(usuarios.rol, [...roles]));
  const [lista, listaSucursales] = await Promise.all([
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
      .orderBy(asc(sucursales.nombre), asc(usuarios.nombreCompleto)),
    esAdmin
      ? db.select({ id: sucursales.id, nombre: sucursales.nombre, activa: sucursales.activa }).from(sucursales).orderBy(asc(sucursales.nombre))
      : Promise.resolve([] as Sucursal[]),
  ]);

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Usuarios{esAdmin ? "" : ` de ${actor.sucursalNombre}`}</h1>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold">Nuevo usuario</h2>
        <FormularioAccion accion={crearUsuario} textoBoton="Crear usuario" reiniciar>
          <div className="grid gap-3 sm:grid-cols-2">
            <Texto etiqueta="Nombre completo" nombre="nombreCompleto" />
            <Texto etiqueta="Usuario" nombre="usuario" autoCapitalize="none" />
            <Texto etiqueta="Contraseña inicial" nombre="password" tipo="password" minLength={8} />
            <SelectorRol roles={roles} />
            {esAdmin && <SelectorSucursal sucursales={listaSucursales.filter((s) => s.activa)} />}
          </div>
          {esAdmin && <p className="text-sm text-stone-500">Para un administrador general deja la sucursal vacía.</p>}
        </FormularioAccion>
      </div>

      {lista.length === 0 && (
        <p className="rounded-2xl bg-white p-6 text-stone-600 ring-1 ring-stone-200">
          Aún no hay usuarios. Crea el primero con el formulario de arriba.
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {lista.map((u) => {
          const esYo = u.id === actor.id;
          return (
            <li key={u.id} className={`rounded-xl bg-white p-4 ring-1 ring-stone-200 ${u.activo ? "" : "opacity-70"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{u.nombreCompleto}</p>
                <Estado activo={u.activo} />
                {esYo && <span className="text-xs text-stone-500">(tú)</span>}
              </div>
              <p className="text-sm text-stone-600">
                {u.usuario} · {PUESTOS[u.rol]}
                {u.sucursal && <> · {u.sucursal}</>}
              </p>
              <Editar resumen={`Editar ${u.usuario}`}>
                <FormularioAccion accion={editarUsuario} textoBoton="Guardar cambios">
                  <input type="hidden" name="id" value={u.id} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Texto etiqueta="Nombre completo" nombre="nombreCompleto" valor={u.nombreCompleto} />
                    <SelectorRol roles={esYo ? [u.rol] : roles} valor={u.rol} />
                    {esAdmin && <SelectorSucursal sucursales={listaSucursales} valor={u.sucursalId} />}
                  </div>
                </FormularioAccion>
                <FormularioAccion accion={restablecerPassword} textoBoton="Cambiar contraseña" reiniciar>
                  <input type="hidden" name="id" value={u.id} />
                  <Texto etiqueta="Nueva contraseña" nombre="password" tipo="password" minLength={8} />
                </FormularioAccion>
                {!esYo && (
                  <FormularioAccion
                    accion={cambiarEstadoUsuario}
                    textoBoton={u.activo ? "Desactivar usuario" : "Reactivar usuario"}
                  >
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="activo" value={String(!u.activo)} />
                  </FormularioAccion>
                )}
              </Editar>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

type TextoProps = {
  etiqueta: string;
  nombre: string;
  tipo?: string;
  valor?: string;
  minLength?: number;
  autoCapitalize?: string;
};

function Texto({ etiqueta, nombre, tipo = "text", valor, minLength, autoCapitalize }: TextoProps) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {etiqueta}
      <input
        name={nombre}
        type={tipo}
        required
        defaultValue={valor}
        minLength={minLength}
        autoCapitalize={autoCapitalize}
        autoComplete={tipo === "password" ? "new-password" : "off"}
        className="campo"
      />
    </label>
  );
}

function SelectorRol({ roles, valor }: { roles: readonly (keyof typeof PUESTOS)[]; valor?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Puesto
      <select name="rol" required defaultValue={valor ?? ""} className="campo">
        {!valor && <option value="">Selecciona…</option>}
        {roles.map((r) => (
          <option key={r} value={r}>
            {PUESTOS[r]}
          </option>
        ))}
      </select>
    </label>
  );
}

function SelectorSucursal({ sucursales, valor }: { sucursales: Sucursal[]; valor?: number | null }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      Sucursal
      <select name="sucursalId" defaultValue={valor ?? ""} className="campo">
        <option value="">— Ninguna (administrador) —</option>
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
            {s.activa ? "" : " (desactivada)"}
          </option>
        ))}
      </select>
    </label>
  );
}
