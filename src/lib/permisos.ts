import type { Rol } from "./auth-tipos";

type Usuario = { id: number; rol: Rol; sucursalId: number | null };
type Merma = { usuarioId: number; sucursalId: number };

/** Ver el detalle y la foto: quien la registró, el gerente de su sucursal o el administrador. */
export function puedeVerMerma(usuario: Usuario, merma: Merma): boolean {
  return usuario.id === merma.usuarioId || puedeCancelarMerma(usuario, merma);
}

/** Cancelar: gerente de la sucursal del registro o administrador. */
export function puedeCancelarMerma(usuario: Usuario, merma: Merma): boolean {
  if (usuario.rol === "admin") return true;
  return usuario.rol === "gerente" && usuario.sucursalId === merma.sucursalId;
}

/** Roles que el usuario puede asignar al crear o editar usuarios. */
export function rolesAsignables(usuario: Pick<Usuario, "rol">): readonly Rol[] {
  if (usuario.rol === "admin") return ["empleado", "encargado", "gerente", "admin"];
  if (usuario.rol === "gerente") return ["empleado", "encargado"];
  return [];
}

/** Administrar (editar, desactivar, cambiar contraseña) a otro usuario. */
export function puedeGestionarUsuario(actor: Usuario, objetivo: Pick<Usuario, "rol" | "sucursalId">): boolean {
  if (actor.rol === "admin") return true;
  return (
    actor.rol === "gerente" &&
    actor.sucursalId === objetivo.sucursalId &&
    rolesAsignables(actor).includes(objetivo.rol)
  );
}
