/** Número de página válido a partir de un parámetro de URL (1 si falta o es inválido). */
export function leerPagina(valor: string | string[] | undefined): number {
  const n = Number(Array.isArray(valor) ? valor[0] : valor);
  return Number.isInteger(n) && n >= 1 && n <= 10_000 ? n : 1;
}
