export const FALLIDOS_SIN_ESPERA = 5;
const ESPERA_MAX_MS = 5 * 60 * 1000;

/**
 * Milisegundos que aún hay que esperar antes de otro intento.
 * Tras 5 fallos la espera se duplica en cada fallo: 1 s, 2 s, 4 s… hasta 5 min.
 */
export function esperaRestanteMs(fallidos: number, ultimoFallo: Date, ahora: Date): number {
  if (fallidos < FALLIDOS_SIN_ESPERA) return 0;
  const espera = Math.min(1000 * 2 ** (fallidos - FALLIDOS_SIN_ESPERA), ESPERA_MAX_MS);
  return Math.max(0, ultimoFallo.getTime() + espera - ahora.getTime());
}
