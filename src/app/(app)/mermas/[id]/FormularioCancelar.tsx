"use client";

import { useActionState, useState } from "react";
import { cancelarMerma, type EstadoCancelacion } from "./actions";

export function FormularioCancelar({ mermaId }: { mermaId: number }) {
  const [estado, accion, enviando] = useActionState<EstadoCancelacion, FormData>(cancelarMerma, {});
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="rounded-lg px-4 py-2 font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
      >
        Cancelar registro
      </button>
    );
  }

  return (
    <form action={accion} className="flex flex-col gap-2 rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
      <input type="hidden" name="id" value={mermaId} />
      <label htmlFor="motivo-cancelacion" className="text-sm font-medium text-red-900">
        Motivo de la cancelación
      </label>
      <input id="motivo-cancelacion" name="motivo" required minLength={3} maxLength={200} className="campo" />
      {estado.error && (
        <p role="alert" className="text-sm text-red-700">
          {estado.error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button disabled={enviando} className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60">
          {enviando ? "Cancelando…" : "Confirmar cancelación"}
        </button>
        <button type="button" onClick={() => setAbierto(false)} className="rounded-lg px-4 py-2 text-stone-700 hover:bg-white">
          Volver
        </button>
      </div>
    </form>
  );
}
