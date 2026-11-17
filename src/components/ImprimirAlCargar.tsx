"use client";

import { useEffect } from "react";
import { estiloBoton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/Icono";

/** Abre el diálogo de impresión al cargar (si se pidió) y ofrece el botón para repetirlo. */
export function ImprimirAlCargar({ automatico }: { automatico: boolean }) {
  useEffect(() => {
    if (automatico) window.print();
  }, [automatico]);

  return (
    <button type="button" onClick={() => window.print()} className={estiloBoton()}>
      <Icono nombre="imprimir" className="size-4" /> Imprimir / Guardar PDF
    </button>
  );
}
