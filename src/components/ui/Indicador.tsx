import { Icono, type NombreIcono } from "./Icono";

type Props = {
  etiqueta: string;
  valor: string;
  detalle?: string;
  icono?: NombreIcono;
  /** Comparación contra el periodo anterior (en %). Positivo = más merma (malo). */
  variacion?: number | null;
  destacado?: boolean;
};

/** Cifra clave (KPI). La variación se colorea como merma: subir es negativo. */
export function Indicador({ etiqueta, valor, detalle, icono, variacion, destacado = false }: Props) {
  const tono = destacado ? "bg-frambuesa-700 text-white ring-frambuesa-700" : "bg-white text-arena-900 ring-arena-200/70";
  const tenue = destacado ? "text-frambuesa-100" : "text-arena-500";

  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-suave ring-1 ${tono}`}>
      {destacado && (
        <div aria-hidden className="pointer-events-none absolute -top-16 -right-10 size-44 rounded-full bg-frambuesa-500/40 blur-2xl" />
      )}
      <div className="relative flex items-center justify-between gap-2">
        <p className={`text-sm font-medium ${tenue}`}>{etiqueta}</p>
        {icono && <Icono nombre={icono} className={`size-5 ${tenue}`} />}
      </div>
      <p className="cifra relative mt-2 text-3xl font-semibold sm:text-4xl">{valor}</p>
      <div className={`relative mt-1 flex flex-wrap items-center gap-x-2 text-sm ${tenue}`}>
        {variacion != null && <Variacion valor={variacion} destacado={destacado} />}
        {detalle && <span>{detalle}</span>}
      </div>
    </div>
  );
}

function Variacion({ valor, destacado }: { valor: number; destacado: boolean }) {
  const sube = valor > 0;
  const color = destacado ? "text-white" : sube ? "text-rojo-600" : "text-menta-600";
  const texto = `${sube ? "+" : ""}${valor.toFixed(1)}%`;
  return (
    <span className={`inline-flex items-center gap-1 font-medium ${color}`}>
      <Icono nombre={sube ? "tendenciaArriba" : "tendenciaAbajo"} className="size-4" />
      <span>
        {texto} <span className="sr-only">respecto al periodo anterior</span>
      </span>
    </span>
  );
}
