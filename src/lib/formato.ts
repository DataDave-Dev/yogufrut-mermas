const ZONA = "America/Monterrey";

const fecha = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, day: "2-digit", month: "2-digit", year: "numeric" });
const hora = new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hour12: true });
const pesos = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" });

export const formatoFecha = (d: Date) => fecha.format(d);
export const formatoHora = (d: Date) => hora.format(d);
export const formatoPesos = (valor: string | number) => pesos.format(Number(valor));
/** "3.500" → "3.5" */
export const formatoCantidad = (valor: string) => String(Number(valor));

export const PUESTOS = {
  empleado: "Empleado",
  encargado: "Encargado de turno",
  gerente: "Gerente",
  admin: "Administrador general",
} as const;
