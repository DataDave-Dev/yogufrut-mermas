import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="text-xl font-bold">No encontrado</h1>
      <p className="text-stone-600">La página o el registro que buscas no existe o no tienes acceso a él.</p>
      <Link href="/" className="text-rose-700 underline">
        Volver al inicio
      </Link>
    </main>
  );
}
