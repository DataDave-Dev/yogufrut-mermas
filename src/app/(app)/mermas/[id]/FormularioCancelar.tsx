"use client";

import { useActionState, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { estiloBoton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/Campo";
import { cancelarMerma, type EstadoCancelacion } from "./actions";

export function FormularioCancelar({ mermaId }: { mermaId: number }) {
  const [estado, accion, enviando] = useActionState<EstadoCancelacion, FormData>(cancelarMerma, {});
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <div>
        <button type="button" onClick={() => setAbierto(true)} className={estiloBoton({ variante: "peligro" })}>
          Cancelar registro
        </button>
      </div>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-4 rounded-2xl bg-rojo-50/60 p-5 ring-1 ring-rojo-100">
      <div>
        <h2 className="font-display font-semibold text-rojo-700">Cancelar este registro</h2>
        <p className="text-sm text-arena-600">No se borra: queda marcado como cancelado, con tu nombre y el motivo.</p>
      </div>
      <input type="hidden" name="id" value={mermaId} />
      <Campo id="motivo-cancelacion" etiqueta="Motivo de la cancelación">
        <input id="motivo-cancelacion" name="motivo" required minLength={3} maxLength={200} className="campo" placeholder="Ej. capturado dos veces" />
      </Campo>
      {estado.error && <Aviso tono="peligro">{estado.error}</Aviso>}
      <div className="flex flex-wrap gap-2">
        <button disabled={enviando} className={estiloBoton({ variante: "peligroSolido" })}>
          {enviando ? "Cancelando…" : "Confirmar cancelación"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className={estiloBoton({ variante: "fantasma" })}>
          Volver
        </button>
      </div>
    </form>
  );
}
