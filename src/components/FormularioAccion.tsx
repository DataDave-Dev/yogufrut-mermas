"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Resultado } from "@/lib/resultado";

type Props = {
  accion: (datos: FormData) => Promise<Resultado>;
  textoBoton: string;
  /** Vaciar el formulario tras un envío exitoso (formularios de alta). */
  reiniciar?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Formulario de administración con mensaje de éxito o error.
 * Envío manual: React 19 vaciaría un <form action> también cuando hay errores.
 */
export function FormularioAccion({ accion, textoBoton, reiniciar = false, className = "", children }: Props) {
  const [resultado, setResultado] = useState<Resultado>({});
  const [enviando, iniciar] = useTransition();

  function handleSubmit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const formulario = ev.currentTarget;
    const datos = new FormData(formulario);
    iniciar(async () => {
      const r = await accion(datos);
      setResultado(r);
      if (r.ok && reiniciar) formulario.reset();
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-3 ${className}`}>
      {children}
      {resultado.error && (
        <p role="alert" className="text-sm text-red-700">
          {resultado.error}
        </p>
      )}
      {resultado.ok && (
        <p role="status" className="text-sm text-emerald-700">
          {resultado.ok}
        </p>
      )}
      <button disabled={enviando} className="boton-primario self-start py-2">
        {enviando ? "Guardando…" : textoBoton}
      </button>
    </form>
  );
}
