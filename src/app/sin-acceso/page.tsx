import Link from "next/link";

export default function SinAcceso() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-xl font-bold">Acceso denegado</h1>
      <p className="text-stone-600">Tu puesto no tiene permiso para ver esta sección.</p>
      <Link href="/" className="text-rose-700 underline">Volver al inicio</Link>
    </main>
  );
}
