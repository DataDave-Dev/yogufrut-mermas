import { eq } from "drizzle-orm";
import Link from "next/link";
import { ListaMermas } from "@/components/ListaMermas";
import { Paginacion } from "@/components/Paginacion";
import { estiloBoton } from "@/components/ui/boton";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Icono } from "@/components/ui/Icono";
import { mermas } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { listarMermas } from "@/lib/consultas-mermas";
import { leerPagina } from "@/lib/pagina";

export const metadata = { title: "Mis registros" };

export default async function MisRegistros({ searchParams }: PageProps<"/mis-registros">) {
  const usuario = await requireUsuario(ROLES_REGISTRO);
  const pagina = leerPagina((await searchParams).pagina);
  const { filas, haySiguiente } = await listarMermas(eq(mermas.usuarioId, usuario.id), pagina);

  return (
    <>
      <EncabezadoPagina
        titulo="Mis registros"
        descripcion="Las mermas que has capturado, de la más reciente a la más antigua."
        acciones={
          <Link href="/registrar" className={estiloBoton()}>
            <Icono nombre="registrar" className="size-4" /> Registrar merma
          </Link>
        }
      />
      <ListaMermas mermas={filas} vacio="Aún no has registrado mermas." />
      <Paginacion pagina={pagina} haySiguiente={haySiguiente} href={(p) => `/mis-registros?pagina=${p}`} />
    </>
  );
}
