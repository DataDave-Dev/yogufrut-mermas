// Periodos y rangos de fechas en la zona de las sucursales, expresados en ms UTC para consultar la base.
// Las fechas de calendario se manejan como texto "AAAA-MM-DD" (fecha local, sin hora).

export const ZONA = "America/Monterrey";
export const TIPOS_PERIODO = ["dia", "semana", "mes"] as const;
export type TipoPeriodo = (typeof TIPOS_PERIODO)[number];

export type Periodo = {
  tipo: TipoPeriodo;
  /** Primer día local del periodo. */
  inicio: string;
  /** Primer día local después del periodo (exclusivo). */
  fin: string;
  desde: number;
  hasta: number;
};

const FECHA = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_DIA = 86_400_000;

const formatoFecha = new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" });
const formatoDesfase = new Intl.DateTimeFormat("en-US", { timeZone: ZONA, timeZoneName: "longOffset" });

export function esFechaValida(texto: string): boolean {
  const m = FECHA.exec(texto);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

/** Fecha local "AAAA-MM-DD" de un instante. */
export function fechaLocal(ms: number): string {
  return formatoFecha.format(ms);
}

/** Desfase de la zona respecto a UTC en un instante, en ms (Monterrey: −6 h). */
export function desfaseMs(ms: number): number {
  const texto = formatoDesfase.formatToParts(ms).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(texto);
  return m ? (m[1] === "-" ? -1 : 1) * (+m[2] * 60 + +m[3]) * 60_000 : 0;
}

/** Instante UTC de la medianoche local de una fecha. */
export function inicioDelDia(fecha: string): number {
  const [a, m, d] = fecha.split("-").map(Number);
  const utc = Date.UTC(a, m - 1, d);
  // Dos pasadas: el desfase correcto es el de la medianoche local, no el de la UTC.
  const aprox = utc - desfaseMs(utc);
  return utc - desfaseMs(aprox);
}

function sumarDias(fecha: string, dias: number): string {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d) + dias * MS_DIA).toISOString().slice(0, 10);
}

function sumarMeses(fecha: string, meses: number): string {
  const [a, m] = fecha.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1 + meses, 1)).toISOString().slice(0, 10);
}

/** Periodo del tipo dado que contiene la fecha de referencia. */
export function crearPeriodo(tipo: TipoPeriodo, referencia: string): Periodo {
  let inicio: string;
  let fin: string;
  if (tipo === "dia") {
    inicio = referencia;
    fin = sumarDias(referencia, 1);
  } else if (tipo === "semana") {
    const [a, m, d] = referencia.split("-").map(Number);
    const diaSemana = new Date(Date.UTC(a, m - 1, d)).getUTCDay(); // 0 = domingo
    inicio = sumarDias(referencia, -((diaSemana + 6) % 7));
    fin = sumarDias(inicio, 7);
  } else {
    inicio = `${referencia.slice(0, 7)}-01`;
    fin = sumarMeses(inicio, 1);
  }
  return { tipo, inicio, fin, desde: inicioDelDia(inicio), hasta: inicioDelDia(fin) };
}

/** Periodo anterior (−1) o siguiente (+1). */
export function desplazar(periodo: Periodo, sentido: -1 | 1): Periodo {
  const referencia =
    periodo.tipo === "mes"
      ? sumarMeses(periodo.inicio, sentido)
      : sumarDias(periodo.inicio, sentido * (periodo.tipo === "dia" ? 1 : 7));
  return crearPeriodo(periodo.tipo, referencia);
}

/** Rango [desde, hasta) en ms para fechas locales inclusivas; cualquiera puede faltar. */
export function rangoDeFechas(desde?: string, hasta?: string): { desde?: number; hasta?: number } {
  return {
    desde: desde ? inicioDelDia(desde) : undefined,
    hasta: hasta ? inicioDelDia(sumarDias(hasta, 1)) : undefined,
  };
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const dma = (fecha: string) => fecha.split("-").reverse().join("/");

/** "11/11/2026", "09/11/2026 – 15/11/2026" o "noviembre 2026". */
export function etiquetaPeriodo(periodo: Periodo): string {
  if (periodo.tipo === "dia") return dma(periodo.inicio);
  if (periodo.tipo === "semana") return `${dma(periodo.inicio)} – ${dma(sumarDias(periodo.fin, -1))}`;
  const [a, m] = periodo.inicio.split("-").map(Number);
  return `${MESES[m - 1]} ${a}`;
}

/** Último día local del periodo (inclusivo), para filtros "hasta". */
export const ultimoDia = (periodo: Periodo): string => sumarDias(periodo.fin, -1);

/** Periodo desde parámetros de URL; lo inválido cae en el mes actual. */
export function leerPeriodo(tipo: unknown, fecha: unknown, ahora = Date.now()): Periodo {
  const t = TIPOS_PERIODO.includes(tipo as TipoPeriodo) ? (tipo as TipoPeriodo) : "mes";
  const f = typeof fecha === "string" && esFechaValida(fecha) ? fecha : fechaLocal(ahora);
  return crearPeriodo(t, f);
}

/** Variación porcentual respecto al periodo anterior; null si antes no hubo nada con qué comparar. */
export function variacion(actual: number, anterior: number): number | null {
  return anterior === 0 ? null : ((actual - anterior) / anterior) * 100;
}

/** "Buenos días", "Buenas tardes" o "Buenas noches" según la hora local. */
export function saludo(ahora = Date.now()): string {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: ZONA, hour: "numeric", hourCycle: "h23" }).format(ahora));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

/** Fecha local de hoy "AAAA-MM-DD". */
export const hoyLocal = (): string => fechaLocal(Date.now());

/** "miércoles, 11 de noviembre" en la zona de las sucursales. */
export const fechaLarga = (ms = Date.now()): string =>
  new Intl.DateTimeFormat("es-MX", { timeZone: ZONA, weekday: "long", day: "numeric", month: "long" }).format(ms);

/** Fechas locales del periodo, en orden. */
export function fechasDelPeriodo(periodo: Periodo): string[] {
  const fechas: string[] = [];
  for (let f = periodo.inicio; f < periodo.fin; f = sumarDias(f, 1)) fechas.push(f);
  return fechas;
}
