/** Convierte "3.5" a entero con la escala dada: decimalAEntero("3.5", 3) === 3500. */
export function decimalAEntero(valor: string, decimales: number): number {
  if (!/^\d+(\.\d+)?$/.test(valor)) throw new Error(`Número inválido: ${valor}`);
  const [entero, fraccion = ""] = valor.split(".");
  if (fraccion.length > decimales) throw new Error(`Demasiados decimales: ${valor}`);
  const n = Number(entero + fraccion.padEnd(decimales, "0"));
  if (!Number.isSafeInteger(n)) throw new Error(`Número demasiado grande: ${valor}`);
  return n;
}

/** Entero escalado a texto decimal: enteroADecimal(1050, 2) === "10.50". */
export function enteroADecimal(valor: number, decimales: number): string {
  const texto = String(valor).padStart(decimales + 1, "0");
  return `${texto.slice(0, -decimales)}.${texto.slice(-decimales)}`;
}

/**
 * Costo total en centavos = cantidad (milésimas) × costo unitario (centavos) / 1000,
 * redondeado a centavos (mitad hacia arriba). BigInt evita desbordes y errores de flotante.
 */
export function costoTotalCentavos(costoUnitarioCentavos: number, cantidadMilesimas: number): number {
  return Number((BigInt(costoUnitarioCentavos) * BigInt(cantidadMilesimas) + 500n) / 1000n);
}
