import { eq } from "drizzle-orm";
import { ListaMermas } from "@/components/ListaMermas";
import { Paginacion } from "@/components/Paginacion";
import { mermas } from "@/db/schema";
import { requireUsuario, ROLES_REGISTRO } from "@/lib/auth";
import { listarMermas } from "@/lib/consultas-mermas";
import { leerPagina } from "@/lib/pagina";

export default async function MisRegistros({ searchParams }: PageProps<"/mis-registros">) {
  const usuario = await requireUsuario(ROLES_REGISTRO);
  const pagina = leerPagina((await searchParams).pagina);
  const { filas, haySiguiente } = await listarMermas(eq(mermas.usuarioId, usuario.id), pagina);

  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">Mis registros</h1>
      <ListaMermas mermas={filas} vacio="Aún no has registrado mermas." />
      <Paginacion pagina={pagina} haySiguiente={haySiguiente} href={(p) => `/mis-registros?pagina=${p}`} />
    </section>
  );
}
