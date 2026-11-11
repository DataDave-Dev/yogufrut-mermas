import Link from "next/link";
import { estiloBoton } from "@/components/ui/boton";
import { Icono } from "@/components/ui/Icono";

export const metadata = { title: "Acceso denegado" };

export default function SinAcceso() {
  return (
    <main id="contenido" className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-miel-50 text-miel-600 ring-1 ring-miel-100">
        <Icono nombre="alerta" className="size-7" />
      </span>
      <h1 className="font-display text-2xl font-semibold">Acceso denegado</h1>
      <p className="max-w-sm text-arena-600">Tu puesto no tiene permiso para ver esta sección. Si crees que es un error, habla con tu gerente.</p>
      <Link href="/" className={`${estiloBoton({ variante: "secundario" })} mt-2`}>
        Volver al inicio
      </Link>
    </main>
  );
}
