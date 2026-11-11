const ZONA = "America/Monterrey";

const fecha = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric" });
const hora = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: true });
const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export const formatoFecha = (d: Date) => fecha.format(d);
export const formatoHora = (d: Date) => hora.format(d);
/** Centavos → "$1,234.50" */
export const formatoPesos = (centavos: number) => pesos.format(centavos / 100);
/** Milésimas → "3.5" */
export const formatoCantidad = (milesimas: number) => String(milesimas / 1000);

export const PUESTOS = {
  empleado: "Empleado",
  encargado: "Encargado de turno",
  gerente: "Gerente",
  admin: "Administrador general",
} as const;
