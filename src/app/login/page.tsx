import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { FormularioLogin } from "./FormularioLogin";

export default async function PaginaLogin() {
  if (await obtenerUsuario()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-200">
        <h1 className="text-2xl font-bold text-rose-700">Yogufrut</h1>
        <p className="mb-6 text-sm text-stone-500">Registro de mermas</p>
        <FormularioLogin />
      </div>
    </main>
  );
}
