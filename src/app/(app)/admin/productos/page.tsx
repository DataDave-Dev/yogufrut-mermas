import { and, asc, eq } from "drizzle-orm";
import { Estado } from "@/components/Estado";
import { FiltrosCatalogo, PaginacionCatalogo, SinCoincidencias } from "@/components/FiltrosCatalogo";
import { FormularioAccion } from "@/components/FormularioAccion";
import { Campo } from "@/components/ui/Campo";
import { DisenoAdmin, Fila, Filas } from "@/components/ui/DisenoAdmin";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { db } from "@/db";
import { productos, UNIDADES } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { enteroADecimal } from "@/lib/costo";
import { condicionCatalogo, leerFiltrosCatalogo, rangoPagina } from "@/lib/filtros-catalogo";
import { formatoPesos } from "@/lib/formato";
import { cambiarEstadoProducto, crearProducto, editarProducto } from "./actions";

export const metadata = { title: "Productos" };

type Producto = typeof productos.$inferSelect;

export default async function Productos({ searchParams }: PageProps<"/admin/productos">) {
  await requireUsuario(["admin"]);
  const filtros = leerFiltrosCatalogo(await searchParams);
  const { limite, desplazamiento } = rangoPagina(filtros.pagina);
  const filtro = and(
    condicionCatalogo(filtros, [productos.nombre, productos.categoria], productos.activo),
    filtros.categoria ? eq(productos.categoria, filtros.categoria) : undefined,
  );
  const [lista, total, todasCategorias] = await Promise.all([
    db.select().from(productos).where(filtro).orderBy(asc(productos.categoria), asc(productos.nombre)).limit(limite).offset(desplazamiento),
    db.$count(productos, filtro),
    db.selectDistinct({ categoria: productos.categoria }).from(productos).orderBy(asc(productos.categoria)),
  ]);
  const categorias = [...Map.groupBy(lista, (p) => p.categoria)];
  const nombresCategorias = todasCategorias.map((c) => c.categoria);

  return (
    <>
      <EncabezadoPagina
        antetitulo="Catálogos"
        titulo="Productos"
        descripcion="Un costo nuevo solo aplica a las mermas que se registren después; las anteriores conservan el suyo."
      />
      <DisenoAdmin
        tituloAlta="Nuevo producto"
        alta={
          <FormularioAccion accion={crearProducto} textoBoton="Crear producto" reiniciar>
            <CamposProducto prefijo="nuevo" categorias={nombresCategorias} />
          </FormularioAccion>
        }
        tituloLista={`${total} ${total === 1 ? "producto" : "productos"}`}
        lista={
          <>
          <FiltrosCatalogo
            ruta="/admin/productos"
            filtros={filtros}
            marcador="Buscar producto…"
            selectores={[
              {
                nombre: "categoria",
                etiqueta: "Filtrar por categoría",
                todos: "Todas las categorías",
                opciones: nombresCategorias.map((c) => ({ id: c, nombre: c })),
              },
            ]}
          />
          {lista.length === 0 && <SinCoincidencias />}
          {categorias.map(([categoria, items]) => (
          <div key={categoria}>
            <h3 className="border-t border-arena-100 bg-arena-50 px-5 py-2 text-xs font-semibold tracking-wide text-arena-500 uppercase">
              {categoria}
            </h3>
            <Filas>
              {items.map((p) => (
                <Fila
                  key={p.id}
                  inactiva={!p.activo}
                  editar={p.nombre}
                  resumen={
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className={`font-semibold ${p.activo ? "text-arena-900" : "text-arena-500"}`}>{p.nombre}</p>
                      <Estado activo={p.activo} />
                      <p className="cifra ml-auto text-sm text-arena-700">
                        {formatoPesos(p.costoUnitarioCentavos)} <span className="text-arena-400">/ {p.unidad}</span>
                      </p>
                    </div>
                  }
                >
                    <FormularioAccion accion={editarProducto} textoBoton="Guardar cambios" variante="secundario">
                      <input type="hidden" name="id" value={p.id} />
                      <CamposProducto prefijo={`p${p.id}`} categorias={nombresCategorias} producto={p} />
                    </FormularioAccion>
                    <FormularioAccion
                      accion={cambiarEstadoProducto}
                      textoBoton={p.activo ? "Desactivar producto" : "Reactivar producto"}
                      variante={p.activo ? "peligro" : "secundario"}
                    >
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="activo" value={String(!p.activo)} />
                    </FormularioAccion>
                </Fila>
              ))}
            </Filas>
          </div>
          ))}
          <PaginacionCatalogo ruta="/admin/productos" filtros={filtros} total={total} />
          </>
        }
      />
    </>
  );
}

function CamposProducto({ prefijo, categorias, producto }: { prefijo: string; categorias: string[]; producto?: Producto }) {
  const id = (campo: string) => `${prefijo}-${campo}`;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Campo id={id("nombre")} etiqueta="Nombre">
        <input id={id("nombre")} name="nombre" required maxLength={80} defaultValue={producto?.nombre} className="campo" />
      </Campo>
      <Campo id={id("categoria")} etiqueta="Categoría">
        <input id={id("categoria")} name="categoria" required maxLength={50} list={id("lista")} defaultValue={producto?.categoria} className="campo" />
        <datalist id={id("lista")}>
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Campo>
      <div className="grid grid-cols-2 gap-4">
        <Campo id={id("unidad")} etiqueta="Unidad">
          <select id={id("unidad")} name="unidad" required defaultValue={producto?.unidad ?? ""} className="campo">
            {!producto && <option value="">Elige…</option>}
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Campo>
        <Campo id={id("costo")} etiqueta="Costo unitario (MXN)">
          <input
            id={id("costo")}
            name="costoUnitario"
            required
            inputMode="decimal"
            defaultValue={producto && enteroADecimal(producto.costoUnitarioCentavos, 2)}
            className="campo cifra"
            placeholder="0.00"
          />
        </Campo>
      </div>
    </div>
  );
}
