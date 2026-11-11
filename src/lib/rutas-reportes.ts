import { aQuery, type FiltrosHistorial } from "./filtros-historial";
import { ultimoDia, type Periodo, type TipoPeriodo } from "./periodos";

const query = (valores: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(valores)) if (v !== undefined) p.set(k, String(v));
  return `?${p}`;
};

export const rutaReporte = (tipo: TipoPeriodo, fecha: string, sucursal?: number) =>
  `/reportes${query({ tipo, fecha, sucursal })}`;

export const rutaResumenGeneral = (tipo: TipoPeriodo, fecha: string) => `/reportes/general${query({ tipo, fecha })}`;

/** Historial filtrado al periodo (y opcionalmente a un producto, motivo o usuario). */
export const rutaHistorial = (periodo: Periodo, filtros: Partial<FiltrosHistorial>) =>
  `/sucursal${aQuery({ ...filtros, desde: periodo.inicio, hasta: ultimoDia(periodo) })}`;

export const rutaExcel = (tipo: TipoPeriodo, fecha: string, sucursal?: number) => `/reportes/excel${query({ tipo, fecha, sucursal })}`;

export const rutaImprimir = (tipo: TipoPeriodo, fecha: string, sucursal?: number) =>
  `/reportes/imprimir${query({ tipo, fecha, sucursal, imprimir: 1 })}`;
