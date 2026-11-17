import Link from "next/link";
import type { ReactNode } from "react";
import { formatoFecha, formatoHora } from "@/lib/formato";
import { ImprimirAlCargar } from "./ImprimirAlCargar";
import { estiloBoton } from "./ui/boton";
import { Icono } from "./ui/Icono";

type Props = {
  titulo: string;
  subtitulo: string;
  /** Quién genera el reporte (nombre completo). */
  autor: string;
  /** Ruta del panel al que regresa el botón "Volver". */
  volver: string;
  /** Abrir el diálogo de impresión al cargar. */
  automatico: boolean;
  children: ReactNode;
};

/** Hoja para imprimir o guardar como PDF: barra de acciones (no se imprime), membrete y contenido. */
export function HojaImpresion({ titulo, subtitulo, autor, volver, automatico, children }: Props) {
  const generado = new Date();
  return (
    <div className="bg-white print:bg-white">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-arena-200 bg-arena-50/90 px-6 py-3 backdrop-blur print:hidden">
        <Link href={volver} className={estiloBoton({ variante: "fantasma" })}>
          <Icono nombre="izquierda" className="size-4" /> Volver al panel
        </Link>
        <ImprimirAlCargar automatico={automatico} />
      </div>

      <main id="contenido" className="mx-auto max-w-[52rem] px-8 py-10 text-[13px] text-arena-900 print:max-w-none print:p-0">
        <header className="flex items-start justify-between gap-6 border-b-2 border-frambuesa-700 pb-4">
          <div>
            <p className="font-display text-sm font-semibold text-frambuesa-700">Yogufrut · Reporte de mermas</p>
            <h1 className="font-display text-2xl font-semibold">{titulo}</h1>
            <p className="mt-0.5 text-arena-600 first-letter:uppercase">{subtitulo}</p>
          </div>
          <p className="text-right text-xs text-arena-500">
            Generado el {formatoFecha(generado)}
            <br />
            {formatoHora(generado)} por {autor}
          </p>
        </header>
        {children}
      </main>
    </div>
  );
}

/** Cifras de resumen en recuadros. */
export function CifrasResumen({ cifras }: { cifras: { etiqueta: string; valor: string; destacada?: boolean }[] }) {
  return (
    <section aria-label="Resumen" className="mt-6 grid gap-4" style={{ gridTemplateColumns: `repeat(${cifras.length}, minmax(0, 1fr))` }}>
      {cifras.map((c) => (
        <div key={c.etiqueta} className="rounded-lg border border-arena-200 p-4">
          <p className="text-arena-500">{c.etiqueta}</p>
          <p className={`cifra text-2xl font-semibold ${c.destacada ? "text-frambuesa-700" : ""}`}>{c.valor}</p>
        </div>
      ))}
    </section>
  );
}

/** Tabla compacta: la primera columna es texto y las demás, cifras alineadas a la derecha. */
export function TablaResumen({ titulo, columnas, filas }: { titulo: string; columnas: string[]; filas: string[][] }) {
  return (
    <section className="print:break-inside-avoid">
      <h2 className="mb-2 font-display text-base font-semibold">{titulo}</h2>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-arena-300 text-xs text-arena-500">
            {columnas.map((c, i) => (
              <th key={c} className={`py-1 font-medium ${i > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f[0]} className="border-b border-arena-100">
              {f.map((celda, i) => (
                <td key={i} className={`py-1 ${i > 0 ? "cifra pl-3 text-right whitespace-nowrap" : ""}`}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
