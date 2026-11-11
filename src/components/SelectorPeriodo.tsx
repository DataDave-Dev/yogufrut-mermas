import Link from "next/link";
import { desplazar, etiquetaPeriodo, hoyLocal, TIPOS_PERIODO, type Periodo, type TipoPeriodo } from "@/lib/periodos";
import { Icono } from "./ui/Icono";

const NOMBRES: Record<TipoPeriodo, string> = { dia: "Día", semana: "Semana", mes: "Mes" };

type Props = { periodo: Periodo; href: (tipo: TipoPeriodo, fecha: string) => string };

/** Pestañas día/semana/mes y navegación al periodo anterior/siguiente. Solo enlaces: sin JavaScript. */
export function SelectorPeriodo({ periodo, href }: Props) {
  const anterior = desplazar(periodo, -1);
  const siguiente = desplazar(periodo, 1);
  // Al cambiar de tipo, conservar "hoy" si está dentro del periodo mostrado (de Mes a Día → hoy, no el día 1).
  const hoy = hoyLocal();
  const referencia = hoy >= periodo.inicio && hoy < periodo.fin ? hoy : periodo.inicio;
  const flecha =
    "grid size-9 place-items-center rounded-lg text-arena-600 transition hover:bg-arena-100 hover:text-arena-900 focus-visible:ring-2 focus-visible:ring-frambuesa-200 focus-visible:outline-none";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-1.5 shadow-suave ring-1 ring-arena-200/70">
      <nav aria-label="Tipo de periodo" className="flex rounded-xl bg-arena-100 p-1">
        {TIPOS_PERIODO.map((tipo) => (
          <Link
            key={tipo}
            href={href(tipo, referencia)}
            aria-current={tipo === periodo.tipo ? "page" : undefined}
            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-arena-600 transition hover:text-arena-900 focus-visible:ring-2 focus-visible:ring-frambuesa-200 focus-visible:outline-none aria-[current=page]:bg-white aria-[current=page]:text-arena-900 aria-[current=page]:shadow-suave"
          >
            {NOMBRES[tipo]}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-1">
        <Link href={href(periodo.tipo, anterior.inicio)} className={flecha} aria-label="Periodo anterior">
          <Icono nombre="izquierda" />
        </Link>
        <p className="min-w-44 text-center font-display font-semibold text-arena-900 first-letter:uppercase">
          {etiquetaPeriodo(periodo)}
        </p>
        <Link href={href(periodo.tipo, siguiente.inicio)} className={flecha} aria-label="Periodo siguiente">
          <Icono nombre="derecha" />
        </Link>
      </div>
    </div>
  );
}
