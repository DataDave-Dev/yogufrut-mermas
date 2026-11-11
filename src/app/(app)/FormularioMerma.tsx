"use client";

import { useActionState, useId, useState } from "react";
import type { ReactNode } from "react";
import { formatoCantidad, formatoPesos } from "@/lib/formato";
import { registrarMerma, type EstadoRegistro } from "./actions";

type Producto = { id: number; nombre: string; categoria: string; unidad: string };
type Motivo = { id: number; nombre: string };
type Props = { productos: Producto[]; motivos: Motivo[]; claveEnvio: string };

export function FormularioMerma({ productos, motivos, claveEnvio }: Props) {
  const [estado, accion, enviando] = useActionState<EstadoRegistro, FormData>(registrarMerma, { claveEnvio });
  const [productoId, setProductoId] = useState("");
  const unidad = productos.find((p) => String(p.id) === productoId)?.unidad ?? "—";
  const categorias = [...Map.groupBy(productos, (p) => p.categoria)];
  const e = estado.errores ?? {};

  return (
    <>
      {estado.exito && (
        <p role="status" className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
          Merma registrada: {formatoCantidad(estado.exito.cantidad)} {estado.exito.unidad} de {estado.exito.producto} ·{" "}
          <strong>{formatoPesos(estado.exito.costoTotal)}</strong>
        </p>
      )}
      {/* key: tras guardar, el formulario se reinicia con una clave de envío nueva */}
      <form key={estado.claveEnvio} action={accion} className="flex flex-col gap-4">
        <input type="hidden" name="claveEnvio" value={estado.claveEnvio} />

        <Campo etiqueta="Producto" error={e.productoId}>
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

        <Campo etiqueta="Cantidad" error={e.cantidad}>
          {(id) => (
            <div className="flex items-center gap-2">
              <input id={id} name="cantidad" inputMode="decimal" required placeholder="0" className="campo" />
              <span className="w-10 text-stone-500" aria-label="Unidad de medida">
                {unidad}
              </span>
            </div>
          )}
        </Campo>

        <Campo etiqueta="Motivo" error={e.motivoId}>
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

        <Campo etiqueta="Observaciones (opcional)" error={e.observaciones}>
          {(id) => <textarea id={id} name="observaciones" maxLength={500} rows={3} className="campo" />}
        </Campo>

        <button disabled={enviando} className="boton-primario">
          {enviando ? "Guardando…" : "Guardar merma"}
        </button>
      </form>
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
