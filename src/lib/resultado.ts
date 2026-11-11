/** Respuesta de las acciones de administración: mensaje de éxito o de error para mostrar al usuario. */
export type Resultado = { ok?: string; error?: string };

/** true si el error de la base es por violar una restricción UNIQUE (nombre repetido). */
export function esNombreRepetido(error: unknown): boolean {
  for (let e: unknown = error; e && typeof e === "object"; e = (e as { cause?: unknown }).cause) {
    const { code, message } = e as { code?: unknown; message?: unknown };
    if (code === "SQLITE_CONSTRAINT_UNIQUE" || (typeof message === "string" && message.includes("UNIQUE constraint failed"))) {
      return true;
    }
  }
  return false;
}
