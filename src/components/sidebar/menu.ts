import type { Rol } from "@/lib/auth-tipos";
import type { NombreIcono } from "../ui/Icono";

export type ElementoMenu = { href: string; texto: string; icono: NombreIcono };
export type GrupoMenu = { titulo: string; elementos: ElementoMenu[] };

type Definicion = ElementoMenu & { roles: readonly Rol[] };

// Ocultar opciones es comodidad: cada página y acción valida el rol en el servidor.
const GRUPOS: { titulo: string; elementos: Definicion[] }[] = [
  {
    titulo: "General",
    elementos: [
      { href: "/", texto: "Inicio", icono: "inicio", roles: ["empleado", "encargado", "gerente", "admin"] },
      { href: "/registrar", texto: "Registrar merma", icono: "registrar", roles: ["empleado", "encargado", "gerente"] },
      { href: "/mis-registros", texto: "Mis registros", icono: "lista", roles: ["empleado", "encargado", "gerente"] },
    ],
  },
  {
    titulo: "Análisis",
    elementos: [
      { href: "/sucursal", texto: "Historial", icono: "historial", roles: ["encargado", "gerente", "admin"] },
      { href: "/reportes", texto: "Reportes", icono: "reportes", roles: ["encargado", "gerente", "admin"] },
    ],
  },
  {
    titulo: "Administración",
    elementos: [
      { href: "/usuarios", texto: "Usuarios", icono: "usuarios", roles: ["gerente", "admin"] },
      { href: "/admin/sucursales", texto: "Sucursales", icono: "sucursal", roles: ["admin"] },
      { href: "/admin/productos", texto: "Productos", icono: "producto", roles: ["admin"] },
      { href: "/admin/motivos", texto: "Motivos", icono: "motivo", roles: ["admin"] },
    ],
  },
];

/** Grupos del menú visibles para un rol (sin grupos vacíos). */
export function menuPara(rol: Rol): GrupoMenu[] {
  return GRUPOS.map((g) => ({
    titulo: g.titulo,
    elementos: g.elementos.filter((e) => e.roles.includes(rol)).map(({ href, texto, icono }) => ({ href, texto, icono })),
  })).filter((g) => g.elementos.length > 0);
}

/** ¿El enlace corresponde a la ruta actual? "/" solo coincide exactamente. */
export function estaActivo(href: string, ruta: string): boolean {
  return href === "/" ? ruta === "/" : ruta === href || ruta.startsWith(`${href}/`);
}

export const COOKIE_SIDEBAR = "sidebar";
