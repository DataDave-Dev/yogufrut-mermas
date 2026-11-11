import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { ListaMermas } from "@/components/ListaMermas";
import { Paginacion } from "@/components/Paginacion";
import { db } from "@/db";
import { motivos, productos, sucursales, usuarios } from "@/db/schema";
import { requireUsuario } from "@/lib/auth";
import { condicionHistorial, listarMermas, totalesMermas } from "@/lib/consultas-mermas";
import { aQuery, leerFiltros, type FiltrosHistorial } from "@/lib/filtros-historial";
import { formatoPesos } from "@/lib/formato";
import { rangoDeFechas } from "@/lib/periodos";

type Opcion = { id: number; nombre: string };

const OPCIONES_ESTADO = [
  { id: "activos", nombre: "Activos" },
  { id: "cancelados", nombre: "Cancelados" },
  { id: "todos", nombre: "Todos" },
];

export default async function Historial({ searchParams }: PageProps<"/sucursal">) {
  const usuario = await requireUsuario(["encargado", "gerente", "admin"]);
  const filtros = leerFiltros(await searchParams);
  const esAdmin = usuario.rol === "admin";

  // Solo el administrador elige sucursal; para los demás se ignora el parámetro.
  const listaSucursales = esAdmin
    ? await db.select({ id: sucursales.id, nombre: sucursales.nombre }).from(sucursales).orderBy(asc(sucursales.nombre))
    : [];
  const sucursal = esAdmin
    ? listaSucursales.find((s) => s.id === filtros.sucursal)
    : { id: usuario.sucursalId!, nombre: usuario.sucursalNombre! };

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">Historial{sucursal ? ` de ${sucursal.nombre}` : ""}</h1>
      {esAdmin && <SelectorSucursal sucursales={listaSucursales} actual={sucursal?.id} />}
      {sucursal && <Resultados sucursalId={sucursal.id} filtros={{ ...filtros, sucursal: esAdmin ? sucursal.id : undefined }} />}
    </section>
  );
}

async function Resultados({ sucursalId, filtros }: { sucursalId: number; filtros: FiltrosHistorial }) {
  const condicion = condicionHistorial({
    sucursalId,
    ...rangoDeFechas(filtros.desde, filtros.hasta),
    productoId: filtros.producto,
    motivoId: filtros.motivo,
    usuarioId: filtros.usuario,
    estado: filtros.estado,
  });
  const [opcionesProductos, opcionesMotivos, opcionesUsuarios, totales, pagina] = await Promise.all([
    db.select({ id: productos.id, nombre: productos.nombre }).from(productos).orderBy(asc(productos.nombre)),
    db.select({ id: motivos.id, nombre: motivos.nombre }).from(motivos).orderBy(asc(motivos.nombre)),
    db
      .select({ id: usuarios.id, nombre: usuarios.nombreCompleto })
      .from(usuarios)
      .where(eq(usuarios.sucursalId, sucursalId))
      .orderBy(asc(usuarios.nombreCompleto)),
    totalesMermas(condicion),
    listarMermas(condicion, filtros.pagina),
  ]);

  return (
    <>
      <form className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200 sm:grid-cols-3">
        {filtros.sucursal && <input type="hidden" name="sucursal" value={filtros.sucursal} />}
        <Fecha etiqueta="Desde" nombre="desde" valor={filtros.desde} />
        <Fecha etiqueta="Hasta" nombre="hasta" valor={filtros.hasta} />
        <Selector etiqueta="Estado" nombre="estado" valor={filtros.estado} vacio={null} opciones={OPCIONES_ESTADO} />
        <Selector etiqueta="Producto" nombre="producto" valor={filtros.producto} opciones={opcionesProductos} />
        <Selector etiqueta="Motivo" nombre="motivo" valor={filtros.motivo} opciones={opcionesMotivos} />
        <Selector etiqueta="Registró" nombre="usuario" valor={filtros.usuario} opciones={opcionesUsuarios} />
        <div className="flex items-center gap-3 sm:col-span-3">
          <button className="boton-primario py-2">Filtrar</button>
          <Link href={`/sucursal${aQuery({ sucursal: filtros.sucursal })}`} className="text-sm text-stone-600 underline">
            Limpiar filtros
          </Link>
        </div>
      </form>

      {filtros.avisoFechas && (
        <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
          {filtros.avisoFechas}
        </p>
      )}

      <p role="status" className="flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-rose-50 px-4 py-3 text-rose-900">
        <span>
          <strong className="text-lg">{totales.registros}</strong> {totales.registros === 1 ? "registro" : "registros"}
        </span>
        <span>
          <strong className="text-lg">{formatoPesos(totales.costoCentavos)}</strong> en mermas
          {filtros.estado !== "activos" && " (sin cancelados)"}
        </span>
      </p>

      <ListaMermas mermas={pagina.filas} mostrarUsuario vacio="No hay registros con estos filtros." />
      <Paginacion
        pagina={filtros.pagina}
        haySiguiente={pagina.haySiguiente}
        href={(p) => `/sucursal${aQuery({ ...filtros, pagina: p })}`}
      />
    </>
  );
}

function SelectorSucursal({ sucursales, actual }: { sucursales: Opcion[]; actual?: number }) {
  return (
    <form className="flex gap-2">
      <label htmlFor="sucursal" className="sr-only">
        Sucursal
      </label>
      <select id="sucursal" name="sucursal" defaultValue={actual ?? ""} className="campo" required>
        <option value="">Selecciona una sucursal…</option>
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>
      <button className="boton-primario py-2">Ver</button>
    </form>
  );
}

function Fecha({ etiqueta, nombre, valor }: { etiqueta: string; nombre: string; valor?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`filtro-${nombre}`} className="text-sm font-medium">
        {etiqueta}
      </label>
      <input id={`filtro-${nombre}`} type="date" name={nombre} defaultValue={valor} className="campo" />
    </div>
  );
}

type SelectorProps = {
  etiqueta: string;
  nombre: string;
  valor?: string | number;
  opciones: { id: string | number; nombre: string }[];
  vacio?: string | null;
};

function Selector({ etiqueta, nombre, valor, opciones, vacio = "Todos" }: SelectorProps) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`filtro-${nombre}`} className="text-sm font-medium">
        {etiqueta}
      </label>
      <select id={`filtro-${nombre}`} name={nombre} defaultValue={valor ?? ""} className="campo">
        {vacio !== null && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
