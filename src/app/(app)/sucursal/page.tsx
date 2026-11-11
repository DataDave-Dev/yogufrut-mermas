import { asc, eq } from "drizzle-orm";
import { ListaMermas } from "@/components/ListaMermas";
import { Paginacion } from "@/components/Paginacion";
import { db } from "@/db";
import { mermas, sucursales } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { listarMermas } from "@/lib/consultas-mermas";
import { leerPagina } from "@/lib/pagina";

export default async function RegistrosSucursal({ searchParams }: PageProps<"/sucursal">) {
  const usuario = await requireUsuario(["gerente", "admin"]);
  const parametros = await searchParams;
  const pagina = leerPagina(parametros.pagina);

  // El gerente solo ve su sucursal; el parámetro de URL únicamente aplica al administrador.
  const lista =
    usuario.rol === "admin"
      ? await db.select({ id: sucursales.id, nombre: sucursales.nombre }).from(sucursales).orderBy(asc(sucursales.nombre))
      : [];
  const pedida = Number(parametros.sucursal);
  const sucursalId = usuario.rol === "admin" ? lista.find((s) => s.id === pedida)?.id : usuario.sucursalId;
  const nombre = usuario.rol === "admin" ? lista.find((s) => s.id === sucursalId)?.nombre : usuario.sucursalNombre;
  const resultado = sucursalId ? await listarMermas(eq(mermas.sucursalId, sucursalId), pagina) : null;

  return (
    <section>
      <h1 className="mb-4 text-xl font-bold">Registros de {nombre ?? "sucursal"}</h1>

      {usuario.rol === "admin" && (
        <form className="mb-4 flex gap-2">
          <label htmlFor="sucursal" className="sr-only">
            Sucursal
          </label>
          <select id="sucursal" name="sucursal" defaultValue={sucursalId ?? ""} className="campo" required>
            <option value="">Selecciona una sucursal…</option>
            {lista.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <button className="boton-primario py-2">Ver</button>
        </form>
      )}

      {resultado && (
        <>
          <ListaMermas mermas={resultado.filas} mostrarUsuario vacio="Esta sucursal aún no tiene registros." />
          <Paginacion
            pagina={pagina}
            haySiguiente={resultado.haySiguiente}
            href={(p) => `/sucursal?${usuario.rol === "admin" ? `sucursal=${sucursalId}&` : ""}pagina=${p}`}
          />
        </>
      )}
    </section>
  );
}
