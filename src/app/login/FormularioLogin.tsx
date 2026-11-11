"use client";

import { useActionState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { estiloBoton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/Campo";
import { iniciarSesion } from "./actions";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, {});

  return (
    <form action={accion} className="flex flex-col gap-4">
      <Campo id="usuario" etiqueta="Usuario">
        <input id="usuario" name="usuario" defaultValue={estado.usuario} autoComplete="username" required autoCapitalize="none" className="campo" />
      </Campo>
      <Campo id="password" etiqueta="Contraseña">
        <input id="password" name="password" type="password" autoComplete="current-password" required className="campo" />
      </Campo>
      {estado.error && <Aviso tono="peligro">{estado.error}</Aviso>}
      <button disabled={enviando} className={estiloBoton({ tamano: "lg", ancho: true })}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
