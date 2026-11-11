import { notFound } from "next/navigation";
import { requireUsuario } from "@/lib/auth";
import { obtenerMerma } from "@/lib/consultas-mermas";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos, PUESTOS } from "@/lib/formato";
import { puedeCancelarMerma, puedeVerMerma } from "@/lib/permisos";
import { FormularioCancelar } from "./FormularioCancelar";

export default async function DetalleMerma({ params }: PageProps<"/mermas/[id]">) {
  const usuario = await requireUsuario();
  const id = Number((await params).id);
  const merma = Number.isInteger(id) && id > 0 ? await obtenerMerma(id) : null;
  // Mismo 404 si no existe o no tiene permiso: no revela qué registros existen.
  if (!merma || !puedeVerMerma(usuario, merma)) notFound();

  const datos: [string, string][] = [
    ["Sucursal", merma.sucursal],
    ["Registró", `${merma.usuario} (${PUESTOS[merma.rolUsuario]})`],
    ["Fecha", `${formatoFecha(merma.creadaEn)} ${formatoHora(merma.creadaEn)}`],
    ["Cantidad", `${formatoCantidad(merma.cantidad)} ${merma.unidad}`],
    ["Motivo", merma.motivo],
    ["Costo unitario", formatoPesos(merma.costoUnitario)],
    ["Observaciones", merma.observaciones ?? "—"],
  ];

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-white p-5 ring-1 ring-stone-200">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">{merma.producto}</h1>
        <p className={`text-xl font-bold ${merma.canceladaEn ? "text-stone-500 line-through" : "text-rose-700"}`}>
          {formatoPesos(merma.costoTotal)}
        </p>
      </header>

      {merma.canceladaEn && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-red-800">
          <strong>Cancelado</strong> por {merma.canceladaPor} el {formatoFecha(merma.canceladaEn)}{" "}
          {formatoHora(merma.canceladaEn)} · Motivo: {merma.motivoCancelacion}
        </p>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {datos.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="contents">
            <dt className="text-stone-500">{etiqueta}</dt>
            <dd className="break-words">{valor}</dd>
          </div>
        ))}
      </dl>

      {merma.tieneFoto && (
        <a href={`/mermas/${merma.id}/foto`} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element -- foto privada servida por ruta protegida */}
          <img
            src={`/mermas/${merma.id}/foto`}
            alt={`Foto de evidencia de ${merma.producto}`}
            className="max-h-96 rounded-xl object-contain ring-1 ring-stone-200"
          />
        </a>
      )}

      {!merma.canceladaEn && puedeCancelarMerma(usuario, merma) && <FormularioCancelar mermaId={merma.id} />}
    </article>
  );
}
