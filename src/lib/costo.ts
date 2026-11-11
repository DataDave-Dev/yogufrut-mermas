/**
 * Costo total = cantidad × costo unitario, redondeado a centavos (mitad hacia arriba).
 * Aritmética entera para no arrastrar errores de punto flotante.
 */
export function calcularCostoTotal(costoUnitario: string, cantidad: string): string {
  const centavos = aEntero(costoUnitario, 2);
  const milesimas = aEntero(cantidad, 3);
  const total = (centavos * milesimas + 500n) / 1000n;
  const texto = total.toString().padStart(3, "0");
  return `${texto.slice(0, -2)}.${texto.slice(-2)}`;
}

function aEntero(valor: string, decimales: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(valor)) throw new Error(`Número inválido: ${valor}`);
  const [entero, fraccion = ""] = valor.split(".");
  if (fraccion.length > decimales) throw new Error(`Demasiados decimales: ${valor}`);
  return BigInt(entero + fraccion.padEnd(decimales, "0"));
}
