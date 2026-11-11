/** Respuesta de las acciones de administración: mensaje de éxito o de error para mostrar al usuario. */
export type Resultado = { ok?: string; error?: string };

/** true si el error de la base es por violar una restricción UNIQUE (nombre repetido). */
export function esNombreRepetido(error: unknown): boolean {
  const codigo = (e: unknown) => (e && typeof e === "object" && "code" in e ? (e as { code: unknown }).code : null);
  return codigo(error) === "23505" || codigo((error as { cause?: unknown })?.cause) === "23505";
}
