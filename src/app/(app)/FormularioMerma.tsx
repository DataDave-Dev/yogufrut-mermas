"use client";

import { startTransition, useActionState, useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { formatoCantidad, formatoPesos } from "@/lib/formato";
import { reducirFoto } from "@/lib/reducir-foto";
import { registrarMerma, type EstadoRegistro } from "./actions";

type Producto = { id: number; nombre: string; categoria: string; unidad: string };
type Motivo = { id: number; nombre: string };
type Props = { productos: Producto[]; motivos: Motivo[]; claveEnvio: string };

export function FormularioMerma({ productos, motivos, claveEnvio }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoRegistro, FormData>(registrarMerma, { claveEnvio });
  const [preparandoFoto, setPreparandoFoto] = useState(false);
  // Datos del último envío, para reenviarlos si el usuario confirma un posible duplicado.
  const ultimoEnvio = useRef<FormData | null>(null);
  // Aviso de duplicado descartado: se oculta y el formulario se vacía.
  const [descartado, setDescartado] = useState<EstadoRegistro | null>(null);
  const [reinicios, setReinicios] = useState(0);
  const mostrarAviso = estado.duplicado && descartado !== estado;
  const ocupado = enviando || preparandoFoto;

  function enviar(datos: FormData) {
    ultimoEnvio.current = datos;
    startTransition(() => accion(datos));
  }

  // ponytail: envío manual en vez de <form action>, porque React 19 vacía el formulario tras
  // cada envío y se perdería lo capturado cuando hay errores. Requiere JavaScript (navegadores objetivo lo tienen).
  async function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const datos = new FormData(ev.currentTarget);
    const foto = datos.get("foto");
    if (foto instanceof File && foto.size > 0) {
      setPreparandoFoto(true);
      datos.set("foto", await reducirFoto(foto), "foto.webp");
      setPreparandoFoto(false);
    }
    enviar(datos);
  }

  function handleConfirmarDuplicado() {
    const datos = ultimoEnvio.current;
    if (!datos) return;
    datos.set("confirmarDuplicado", "1");
    enviar(datos);
  }

  function handleDescartarDuplicado() {
    setDescartado(estado);
    setReinicios((r) => r + 1);
  }

  return (
    <>
      {estado.exito && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
          Merma registrada: {formatoCantidad(estado.exito.cantidadMilesimas)} {estado.exito.unidad} de {estado.exito.producto} ·{" "}
          <strong>{formatoPesos(estado.exito.costoTotalCentavos)}</strong>
        </p>
      )}
      {mostrarAviso && (
        <div role="alertdialog" aria-labelledby="aviso-duplicado" className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-900 ring-1 ring-amber-200">
          <p id="aviso-duplicado" className="font-medium">
            Registraste este mismo producto y cantidad hace menos de 5 minutos. ¿Guardarlo de todos modos?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={handleConfirmarDuplicado} disabled={ocupado} className="boton-primario py-2">
              Sí, guardar
            </button>
            <button
              type="button"
              onClick={handleDescartarDuplicado}
              disabled={ocupado}
              className="rounded-lg px-4 py-2 font-semibold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-100"
            >
              No, descartar
            </button>
          </div>
        </div>
      )}
      {/* key: tras guardar o descartar, el formulario (y su estado) se reinicia */}
      <form key={`${estado.claveEnvio}-${reinicios}`} onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="claveEnvio" value={estado.claveEnvio} />
        <CamposMerma productos={productos} motivos={motivos} errores={estado.errores ?? {}} />
        <button disabled={ocupado || mostrarAviso} className="boton-primario">
          {preparandoFoto ? "Preparando foto…" : enviando ? "Guardando…" : "Guardar merma"}
        </button>
      </form>
    </>
  );
}

type CamposProps = {
  productos: Producto[];
  motivos: Motivo[];
  errores: NonNullable<EstadoRegistro["errores"]>;
};

function CamposMerma({ productos, motivos, errores }: CamposProps) {
  const [productoId, setProductoId] = useState("");
  const unidad = productos.find((p) => String(p.id) === productoId)?.unidad ?? "—";
  const categorias = [...Map.groupBy(productos, (p) => p.categoria)];

  return (
    <>
      <Campo etiqueta="Producto" error={errores.productoId}>
        {(id) => (
          // ponytail: <select> nativo con grupos y búsqueda tecleando; buscador propio si 78 productos resultan lentos.
          <select
            id={id}
            name="productoId"
            required
            className="campo"
            value={productoId}
            onChange={(ev) => setProductoId(ev.target.value)}
          >
            <option value="">Selecciona un producto…</option>
            {categorias.map(([categoria, lista]) => (
              <optgroup key={categoria} label={categoria}>
                {lista.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}
      </Campo>

      <Campo etiqueta="Cantidad" error={errores.cantidad}>
        {(id) => (
          <div className="flex items-center gap-2">
            <input id={id} name="cantidad" inputMode="decimal" required placeholder="0" className="campo" />
            <span className="w-10 text-stone-500" aria-label="Unidad de medida">
              {unidad}
            </span>
          </div>
        )}
      </Campo>

      <Campo etiqueta="Motivo" error={errores.motivoId}>
        {(id) => (
          <select id={id} name="motivoId" required className="campo" defaultValue="">
            <option value="">Selecciona un motivo…</option>
            {motivos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        )}
      </Campo>

      <Campo etiqueta="Observaciones (opcional)" error={errores.observaciones}>
        {(id) => <textarea id={id} name="observaciones" maxLength={500} rows={3} className="campo" />}
      </Campo>

      <Campo etiqueta="Foto de evidencia (opcional)" error={errores.foto}>
        {(id) => (
          <input
            id={id}
            name="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:font-medium hover:file:bg-stone-200"
          />
        )}
      </Campo>
    </>
  );
}

type CampoProps = { etiqueta: string; error?: string; children: (id: string) => ReactNode };

function Campo({ etiqueta, error, children }: CampoProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      {children(id)}
      {error && <span className="text-sm text-red-700">{error}</span>}
    </div>
  );
}
