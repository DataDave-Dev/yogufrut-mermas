"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { estiloBoton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
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
        <Aviso tono="exito" className="mb-6">
          Merma registrada: {formatoCantidad(estado.exito.cantidadMilesimas)} {estado.exito.unidad} de {estado.exito.producto} ·{" "}
          <strong className="cifra">{formatoPesos(estado.exito.costoTotalCentavos)}</strong>
        </Aviso>
      )}
      {mostrarAviso && (
        <Aviso tono="alerta" rol="alertdialog" className="mb-6" id="aviso-duplicado">
          <p className="font-medium">Registraste este mismo producto y cantidad hace menos de 5 minutos. ¿Guardarlo de todos modos?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={handleConfirmarDuplicado} disabled={ocupado} className={estiloBoton({ tamano: "sm" })}>
              Sí, guardar
            </button>
            <button type="button" onClick={handleDescartarDuplicado} disabled={ocupado} className={estiloBoton({ variante: "secundario", tamano: "sm" })}>
              No, descartar
            </button>
          </div>
        </Aviso>
      )}
      {/* key: tras guardar o descartar, el formulario (y su estado) se reinicia */}
      <form key={`${estado.claveEnvio}-${reinicios}`} onSubmit={handleSubmit} className="flex flex-col gap-5">
        <input type="hidden" name="claveEnvio" value={estado.claveEnvio} />
        <CamposMerma productos={productos} motivos={motivos} errores={estado.errores ?? {}} />
        <button disabled={ocupado || mostrarAviso} className={estiloBoton({ tamano: "lg", ancho: true })}>
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

const conError = (error?: string, id?: string) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

function CamposMerma({ productos, motivos, errores }: CamposProps) {
  const [productoId, setProductoId] = useState("");
  const [nombreFoto, setNombreFoto] = useState("");
  const unidad = productos.find((p) => String(p.id) === productoId)?.unidad;
  const categorias = [...Map.groupBy(productos, (p) => p.categoria)];

  return (
    <>
      <Campo id="merma-producto" etiqueta="Producto" error={errores.productoId}>
        {/* ponytail: <select> nativo con grupos y búsqueda tecleando; buscador propio si 78 productos resultan lentos. */}
        <select
          id="merma-producto"
          name="productoId"
          required
          className="campo"
          value={productoId}
          onChange={(ev) => setProductoId(ev.target.value)}
          {...conError(errores.productoId, "merma-producto")}
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
      </Campo>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo id="merma-cantidad" etiqueta="Cantidad" error={errores.cantidad} ayuda={unidad ? undefined : "Elige el producto para ver la unidad"}>
          <div className="relative">
            <input
              id="merma-cantidad"
              name="cantidad"
              inputMode="decimal"
              required
              placeholder="0"
              className="campo cifra pr-14 text-lg"
              {...conError(errores.cantidad, "merma-cantidad")}
            />
            <span
              className="pointer-events-none absolute inset-y-0 right-3 grid place-items-center text-sm font-medium text-arena-500"
              aria-label="Unidad de medida"
            >
              {unidad ?? "—"}
            </span>
          </div>
        </Campo>

        <Campo id="merma-motivo" etiqueta="Motivo" error={errores.motivoId}>
          <select id="merma-motivo" name="motivoId" required className="campo" defaultValue="" {...conError(errores.motivoId, "merma-motivo")}>
            <option value="">Selecciona un motivo…</option>
            {motivos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </Campo>
      </div>

      <Campo id="merma-observaciones" etiqueta="Observaciones (opcional)" error={errores.observaciones}>
        <textarea
          id="merma-observaciones"
          name="observaciones"
          maxLength={500}
          rows={3}
          className="campo"
          placeholder="Ej. se detectó producto vencido durante la revisión"
        />
      </Campo>

      <Campo id="merma-foto" etiqueta="Foto de evidencia (opcional)" error={errores.foto}>
        <label
          htmlFor="merma-foto"
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-arena-300 bg-arena-50 px-4 py-3.5 text-sm transition hover:border-frambuesa-300 hover:bg-frambuesa-50 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-frambuesa-100"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-arena-500 shadow-suave">
            <Icono nombre="camara" />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-arena-800">{nombreFoto || "Tomar o elegir foto"}</span>
            <span className="block text-xs text-arena-500">JPEG, PNG o WebP · hasta 5 MB</span>
          </span>
          <input
            id="merma-foto"
            name="foto"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(ev) => setNombreFoto(ev.target.files?.[0]?.name ?? "")}
          />
        </label>
      </Campo>
    </>
  );
}
