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
