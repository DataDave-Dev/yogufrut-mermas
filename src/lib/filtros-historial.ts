import { z } from "zod";
import { esFechaValida } from "./periodos";

export const ESTADOS = ["activos", "cancelados", "todos"] as const;

const fecha = z
  .string()
  .refine(esFechaValida)
  .optional()
  .catch(undefined);
const id = z.coerce.number().int().positive().optional().catch(undefined);

const esquema = z.object({
  sucursal: id,
  desde: fecha,
  hasta: fecha,
  producto: id,
  motivo: id,
  usuario: id,
  estado: z.enum(ESTADOS).catch("activos"),
  pagina: z.coerce.number().int().min(1).max(10_000).catch(1),
});

export type FiltrosHistorial = z.infer<typeof esquema> & { avisoFechas?: string };

type Parametros = Record<string, string | string[] | undefined>;

/** Filtros válidos a partir de la URL; lo inválido se ignora en vez de fallar. */
export function leerFiltros(parametros: Parametros): FiltrosHistorial {
  const planos = Object.fromEntries(
    Object.entries(parametros).map(([k, v]) => [k, (Array.isArray(v) ? v[0] : v) || undefined]),
  );
  const filtros: FiltrosHistorial = esquema.parse(planos);
  if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
    return { ...filtros, desde: undefined, hasta: undefined, avisoFechas: "La fecha «desde» es posterior a «hasta»; no se aplicó el rango." };
  }
  return filtros;
}

/** Query string con los filtros (sin valores vacíos ni por defecto), para enlaces y paginación. */
export function aQuery(filtros: Partial<FiltrosHistorial>): string {
  const p = new URLSearchParams();
  for (const clave of ["sucursal", "desde", "hasta", "producto", "motivo", "usuario", "estado", "pagina"] as const) {
    const valor = filtros[clave];
    if (valor === undefined || (clave === "estado" && valor === "activos") || (clave === "pagina" && valor === 1)) continue;
    p.set(clave, String(valor));
  }
  const texto = p.toString();
  return texto ? `?${texto}` : "";
}
