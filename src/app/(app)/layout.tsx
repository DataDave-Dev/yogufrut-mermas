import Link from "next/link";
import { salir } from "@/app/login/actions";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { PUESTOS } from "@/lib/formato";

// Menú según rol. Fase 1: todos los usuarios de sucursal registran y ven sus registros.
const MENU = [
  { href: "/", texto: "Registrar merma", roles: ROLES_REGISTRO },
  { href: "/mis-registros", texto: "Mis registros", roles: ROLES_REGISTRO },
] as const;

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const usuario = await requireUsuario();
  const menu = MENU.filter((m) => (m.roles as readonly string[]).includes(usuario.rol));

  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="font-semibold">{usuario.nombreCompleto}</p>
            <p className="text-sm text-stone-500">
              {PUESTOS[usuario.rol]}
              {usuario.sucursalNombre && <> · {usuario.sucursalNombre}</>}
            </p>
          </div>
          <form action={salir}>
            <button className="rounded-lg px-3 py-2 text-sm text-stone-600 hover:bg-stone-100">Cerrar sesión</button>
          </form>
        </div>
        <nav aria-label="Principal" className="mx-auto flex max-w-3xl gap-1 px-4">
          {menu.map((m) => (
            <Link key={m.href} href={m.href} className="rounded-t-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900">
              {m.texto}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 p-4">{children}</main>
    </>
  );
}
