import { cookies } from "next/headers";
import { salir } from "@/app/login/actions";
import { AppShell } from "@/components/sidebar/AppShell";
import { COOKIE_SIDEBAR, menuPara } from "@/components/sidebar/menu";
import { requireUsuario } from "@/lib/auth";
import { PUESTOS } from "@/lib/formato";

export default async function LayoutApp({ children }: LayoutProps<"/">) {
  const usuario = await requireUsuario();
  const colapsado = (await cookies()).get(COOKIE_SIDEBAR)?.value === "colapsado";

  return (
    <AppShell
      menu={menuPara(usuario.rol)}
      usuario={{ nombre: usuario.nombreCompleto, puesto: PUESTOS[usuario.rol], sucursal: usuario.sucursalNombre }}
      colapsadoInicial={colapsado}
      salir={salir}
    >
      {children}
    </AppShell>
  );
}
