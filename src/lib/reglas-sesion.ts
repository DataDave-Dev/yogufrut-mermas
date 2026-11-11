export const INACTIVIDAD_MAX_MS = 30 * 60 * 1000;
export const DURACION_MAX_MS = 8 * 60 * 60 * 1000;

/** Sesión vigente si no lleva 30 min inactiva ni 8 h desde que se creó. */
export function sesionVigente(creadaEn: Date, ultimoAcceso: Date, ahora: Date): boolean {
  const t = ahora.getTime();
  return t - ultimoAcceso.getTime() < INACTIVIDAD_MAX_MS && t - creadaEn.getTime() < DURACION_MAX_MS;
}
