import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso } from "@/components/ui/Aviso";
import { Icono } from "@/components/ui/Icono";
import { Insignia } from "@/components/ui/Insignia";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { requireUsuario } from "@/lib/auth";
import { obtenerMerma } from "@/lib/consultas-mermas";
import { formatoCantidad, formatoFecha, formatoHora, formatoPesos, PUESTOS } from "@/lib/formato";
import { puedeCancelarMerma, puedeVerMerma } from "@/lib/permisos";
import { FormularioCancelar } from "./FormularioCancelar";

export const metadata = { title: "Detalle de merma" };

export default async function DetalleMerma({ params }: PageProps<"/mermas/[id]">) {
  const usuario = await requireUsuario();
  const id = Number((await params).id);
  const merma = Number.isInteger(id) && id > 0 ? await obtenerMerma(id) : null;
  // Mismo 404 si no existe o no tiene permiso: no revela qué registros existen.
  if (!merma || !puedeVerMerma(usuario, merma)) notFound();

  const volver = usuario.id === merma.usuarioId ? "/mis-registros" : "/sucursal";
  const datos: [string, string][] = [
    ["Sucursal", merma.sucursal],
    ["Registró", `${merma.usuario} (${PUESTOS[merma.rolUsuario]})`],
    ["Fecha", `${formatoFecha(merma.creadaEn)} ${formatoHora(merma.creadaEn)}`],
    ["Cantidad", `${formatoCantidad(merma.cantidadMilesimas)} ${merma.unidad}`],
    ["Motivo", merma.motivo],
    ["Costo unitario", formatoPesos(merma.costoUnitarioCentavos)],
    ["Observaciones", merma.observaciones ?? "—"],
  ];

  return (
    <div className="flex w-full max-w-6xl flex-col gap-5">
      <Link href={volver} className="inline-flex w-fit items-center gap-1 text-sm font-medium text-arena-600 hover:text-arena-900">
        <Icono nombre="izquierda" className="size-4" /> Volver
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 flex items-center gap-2 text-sm text-arena-500">
            Merma #{merma.id} {merma.canceladaEn && <Insignia tono="peligro">Cancelado</Insignia>}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight">{merma.producto}</h1>
        </div>
        <p className={`cifra text-3xl font-semibold ${merma.canceladaEn ? "text-arena-400 line-through" : "text-frambuesa-700"}`}>
          {formatoPesos(merma.costoTotalCentavos)}
        </p>
      </header>

      {merma.canceladaEn && (
        <Aviso tono="peligro" rol="status">
          <strong>Cancelado</strong> por {merma.canceladaPor} el {formatoFecha(merma.canceladaEn)} {formatoHora(merma.canceladaEn)} · Motivo:{" "}
          {merma.motivoCancelacion}
        </Aviso>
      )}

      <div className={`grid gap-5 ${merma.tieneFoto ? "md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] xl:grid-cols-[minmax(0,1fr)_minmax(0,32rem)]" : ""}`}>
        <Tarjeta titulo="Datos del registro">
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            {datos.map(([etiqueta, valor]) => (
              <div key={etiqueta} className="contents">
                <dt className="text-arena-500">{etiqueta}</dt>
                <dd className="break-words text-arena-900">{valor}</dd>
              </div>
            ))}
          </dl>
        </Tarjeta>

        {merma.tieneFoto && (
          <a
            href={`/mermas/${merma.id}/foto`}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-2xl bg-white shadow-suave ring-1 ring-arena-200/70 transition hover:shadow-elevada"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- foto privada servida por ruta protegida */}
            <img src={`/mermas/${merma.id}/foto`} alt={`Foto de evidencia de ${merma.producto}`} className="aspect-[4/3] w-full object-cover" />
            <span className="block px-4 py-2.5 text-sm text-arena-600">Foto de evidencia · abrir</span>
          </a>
        )}
      </div>

      {!merma.canceladaEn && puedeCancelarMerma(usuario, merma) && <FormularioCancelar mermaId={merma.id} />}
    </div>
  );
}
