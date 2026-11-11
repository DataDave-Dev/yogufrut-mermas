"use client";

import { useActionState } from "react";
import { iniciarSesion } from "./actions";

export function FormularioLogin() {
  const [estado, accion, enviando] = useActionState(iniciarSesion, {});

  return (
    <form action={accion} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Usuario
        <input name="usuario" defaultValue={estado.usuario} autoComplete="username" required autoCapitalize="none" className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className="campo" />
      </label>
      {estado.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {estado.error}
        </p>
      )}
      <button disabled={enviando} className="boton-primario">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
