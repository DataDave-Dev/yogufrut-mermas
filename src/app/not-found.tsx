import Link from "next/link";
import { estiloBoton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/Icono";

export default function NoEncontrado() {
  return (
    <main id="contenido" className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-arena-100 text-arena-500">
        <Icono nombre="vacio" className="size-7" />
      </span>
      <h1 className="font-display text-2xl font-semibold">No encontrado</h1>
      <p className="max-w-sm text-arena-600">La página o el registro que buscas no existe o no tienes acceso a él.</p>
      <Link href="/" className={`${estiloBoton({ variante: "secundario" })} mt-2`}>
        Volver al inicio
      </Link>
    </main>
  );
}
