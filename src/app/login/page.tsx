import { redirect } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { FormularioLogin } from "./FormularioLogin";

export const metadata = { title: "Iniciar sesión" };

export default async function PaginaLogin() {
  if (await obtenerUsuario()) redirect("/");

  return (
    <main id="contenido" className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      {/* Panel de marca: solo en pantallas anchas. */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-frambuesa-800 p-12 text-white lg:flex lg:flex-col lg:justify-between"
      >
        <div className="pointer-events-none absolute -top-32 -left-24 size-[28rem] rounded-full bg-frambuesa-500/50 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-40 size-[30rem] rounded-full bg-miel-600/25 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-2xl bg-white font-display text-xl font-bold text-frambuesa-700">Y</span>
          <span className="font-display text-xl font-semibold">Yogufrut</span>
        </div>
        <div className="relative max-w-md">
          <p className="font-display text-4xl leading-tight font-semibold tracking-tight">
            Cada merma registrada es una pérdida que puedes reducir.
          </p>
          <p className="mt-4 text-frambuesa-100">
            Registra en segundos qué se desperdició, por qué y quién lo reportó. Sin chats ni hojas sueltas.
          </p>
        </div>
        <p className="relative text-sm text-frambuesa-200">Control de mermas por sucursal</p>
      </section>

      <section className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-frambuesa-600 font-display text-lg font-bold text-white shadow-acento">Y</span>
            <span className="font-display text-lg font-semibold">Yogufrut</span>
          </div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-arena-900">Inicia sesión</h1>
          <p className="mt-1 mb-8 text-arena-600">Usa el usuario que te dio tu gerente.</p>
          <FormularioLogin />
        </div>
      </section>
    </main>
  );
}
