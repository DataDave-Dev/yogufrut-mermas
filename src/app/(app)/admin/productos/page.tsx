import { asc } from "drizzle-orm";
import { Editar } from "@/components/Editar";
import { Estado } from "@/components/Estado";
import { FormularioAccion } from "@/components/FormularioAccion";
import { db } from "@/db";
import { productos, UNIDADES } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { enteroADecimal } from "@/lib/costo";
import { formatoPesos } from "@/lib/formato";
import { cambiarEstadoProducto, crearProducto, editarProducto } from "./actions";

type Producto = typeof productos.$inferSelect;

export default async function Productos() {
  await requireUsuario(["admin"]);
  const lista = await db.select().from(productos).orderBy(asc(productos.categoria), asc(productos.nombre));
  const categorias = [...Map.groupBy(lista, (p) => p.categoria)];

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Catálogo de productos</h1>

      <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-200">
        <h2 className="mb-3 font-semibold">Nuevo producto</h2>
        <FormularioAccion accion={crearProducto} textoBoton="Crear producto" reiniciar>
          <CamposProducto categorias={categorias.map(([c]) => c)} />
        </FormularioAccion>
      </div>

      {categorias.map(([categoria, items]) => (
        <div key={categoria}>
          <h2 className="mb-2 text-sm font-semibold tracking-wide text-stone-500 uppercase">{categoria}</h2>
          <ul className="flex flex-col gap-2">
            {items.map((p) => (
              <li key={p.id} className={`rounded-xl bg-white p-4 ring-1 ring-stone-200 ${p.activo ? "" : "opacity-70"}`}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{p.nombre}</p>
                  <Estado activo={p.activo} />
                  <p className="ml-auto text-sm text-stone-600">
                    {formatoPesos(p.costoUnitarioCentavos)} / {p.unidad}
                  </p>
                </div>
                <Editar resumen={`Editar ${p.nombre}`}>
                  <FormularioAccion accion={editarProducto} textoBoton="Guardar cambios">
                    <input type="hidden" name="id" value={p.id} />
                    <CamposProducto categorias={categorias.map(([c]) => c)} producto={p} />
                    <p className="text-sm text-stone-500">Un costo nuevo solo aplica a las mermas que se registren después.</p>
                  </FormularioAccion>
                  <FormularioAccion
                    accion={cambiarEstadoProducto}
                    textoBoton={p.activo ? "Desactivar producto" : "Reactivar producto"}
                  >
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="activo" value={String(!p.activo)} />
                  </FormularioAccion>
                </Editar>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function CamposProducto({ categorias, producto }: { categorias: string[]; producto?: Producto }) {
  const idLista = `categorias-${producto?.id ?? "nuevo"}`;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Nombre
        <input name="nombre" required maxLength={80} defaultValue={producto?.nombre} className="campo" />
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Categoría
        <input name="categoria" required maxLength={50} list={idLista} defaultValue={producto?.categoria} className="campo" />
        <datalist id={idLista}>
          {categorias.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Unidad
        <select name="unidad" required defaultValue={producto?.unidad ?? ""} className="campo">
          {!producto && <option value="">Selecciona…</option>}
          {UNIDADES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium">
        Costo unitario (MXN)
        <input
          name="costoUnitario"
          required
          inputMode="decimal"
          defaultValue={producto && enteroADecimal(producto.costoUnitarioCentavos, 2)}
          className="campo"
          placeholder="0.00"
        />
      </label>
    </div>
  );
}
