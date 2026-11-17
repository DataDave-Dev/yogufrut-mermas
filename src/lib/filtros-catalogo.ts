import { and, eq, like, or, type Column, type SQL } from "drizzle-orm";
import { z } from "zod";
import { ROLES } from "./auth-tipos";

/** Filas por página en las pantallas de administración (cada fila lleva sus formularios de edición). */
export const POR_PAGINA_CATALOGO = 25;

export const ESTADOS_CATALOGO = ["todos", "activos", "inactivos"] as const;

const texto = (maximo: number) =>
  z
    .string()
    .trim()
    .max(maximo)
    .transform((v) => v || undefined)
    .optional()
    .catch(undefined);

const esquema = z.object({
  q: texto(80),
  estado: z.enum(ESTADOS_CATALOGO).catch("todos"),
  rol: z.enum(ROLES).optional().catch(undefined),
  sucursal: z.coerce.number().int().positive().optional().catch(undefined),
  categoria: texto(50),
  pagina: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export type FiltrosCatalogo = z.infer<typeof esquema>;

type Parametros = Record<string, string | string[] | undefined>;

/** Filtros válidos a partir de la URL; lo inválido se ignora en vez de fallar. */
export function leerFiltrosCatalogo(parametros: Parametros): FiltrosCatalogo {
  return esquema.parse(
    Object.fromEntries(Object.entries(parametros).map(([k, v]) => [k, (Array.isArray(v) ? v[0] : v) || undefined])),
  );
}

/** Query string con los filtros (sin valores vacíos ni por defecto), para la paginación. */
export function aQueryCatalogo(filtros: Partial<FiltrosCatalogo>): string {
  const p = new URLSearchParams();
  for (const clave of ["q", "estado", "rol", "sucursal", "categoria", "pagina"] as const) {
    const valor = filtros[clave];
    if (valor === undefined || (clave === "estado" && valor === "todos") || (clave === "pagina" && valor === 1)) continue;
    p.set(clave, String(valor));
  }
  const cadena = p.toString();
  return cadena ? `?${cadena}` : "";
}

/** Condición SQL de búsqueda por texto y estado; cada pantalla añade sus filtros propios. */
export function condicionCatalogo(filtros: FiltrosCatalogo, columnasTexto: Column[], activo: Column): SQL | undefined {
  // ponytail: LIKE de SQLite ignora mayúsculas solo en ASCII («lopez» no encuentra «López»);
  // columna normalizada o FTS5 si la búsqueda sin acentos hace falta.
  return and(
    filtros.q ? or(...columnasTexto.map((c) => like(c, `%${filtros.q}%`))) : undefined,
    filtros.estado === "todos" ? undefined : eq(activo, filtros.estado === "activos"),
  );
}

/** `limit`/`offset` de la página pedida. */
export function rangoPagina(pagina: number) {
  return { limite: POR_PAGINA_CATALOGO, desplazamiento: (pagina - 1) * POR_PAGINA_CATALOGO };
}
