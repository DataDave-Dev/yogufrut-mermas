import type { Barra } from "@/components/Barras";
import { formatoPesos } from "./formato";

type Grupo = { registros: number; costoCentavos: number };

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const texto = (g?: Grupo) => (g ? `${formatoPesos(g.costoCentavos)} · ${g.registros} ${g.registros === 1 ? "registro" : "registros"}` : "");

/** Siete barras de lunes a domingo a partir del agrupado de SQLite (0 = domingo). */
export function barrasDiaSemana(grupos: (Grupo & { diaSemana: number })[]): Barra[] {
  return DIAS_SEMANA.map((etiqueta, i) => {
    const g = grupos.find((x) => x.diaSemana === (i + 1) % 7);
    return { etiqueta, valor: g?.costoCentavos ?? 0, texto: texto(g) };
  });
}

/** Una barra por hora, de la primera a la última con registros (los huecos quedan en cero). */
export function barrasHora(grupos: (Grupo & { hora: number })[]): Barra[] {
  if (grupos.length === 0) return [];
  const horas = grupos.map((g) => g.hora);
  const desde = Math.min(...horas);
  return Array.from({ length: Math.max(...horas) - desde + 1 }, (_, i) => {
    const g = grupos.find((x) => x.hora === desde + i);
    return { etiqueta: `${desde + i}h`, valor: g?.costoCentavos ?? 0, texto: texto(g) };
  });
}

/** Porcentaje de `parte` sobre `total` con un decimal ("—" si no hay total). */
export const porcentaje = (parte: number, total: number): string => (total > 0 ? `${((parte / total) * 100).toFixed(1)}%` : "—");
