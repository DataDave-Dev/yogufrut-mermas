"use client";

import { useState, useTransition } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Resultado } from "@/lib/resultado";
import { Aviso } from "./ui/Aviso";
import { estiloBoton } from "./ui/boton";

type Props = {
  accion: (datos: FormData) => Promise<Resultado>;
  textoBoton: string;
  /** Vaciar el formulario tras un envío exitoso (formularios de alta). */
  reiniciar?: boolean;
  variante?: "primario" | "secundario" | "peligro";
  className?: string;
  children: ReactNode;
};

/**
 * Formulario de administración con mensaje de éxito o error.
 * Envío manual: React 19 vaciaría un <form action> también cuando hay errores.
 */
export function FormularioAccion({ accion, textoBoton, reiniciar = false, variante = "primario", className = "", children }: Props) {
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
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${className}`}>
      {children}
      {resultado.error && <Aviso tono="peligro">{resultado.error}</Aviso>}
      {resultado.ok && <Aviso tono="exito">{resultado.ok}</Aviso>}
      <div>
        <button disabled={enviando} className={estiloBoton({ variante })}>
          {enviando ? "Guardando…" : textoBoton}
        </button>
      </div>
    </form>
  );
}
