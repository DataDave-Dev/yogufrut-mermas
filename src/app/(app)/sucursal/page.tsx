import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { Aviso } from "@/components/ui/Aviso";
import { estiloBoton } from "@/components/ui/boton";
import { Campo } from "@/components/ui/Campo";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Icono } from "@/components/ui/Icono";
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

export const metadata = { title: "Historial" };

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
    <>
      <EncabezadoPagina
        antetitulo="Historial"
        titulo={sucursal ? `Historial de ${sucursal.nombre}` : "Historial"}
        descripcion="Filtra los registros por fecha, producto, motivo o quién los capturó."
        acciones={esAdmin && <SelectorSucursal sucursales={listaSucursales} actual={sucursal?.id} />}
      />
      {sucursal ? (
        <Resultados sucursalId={sucursal.id} filtros={{ ...filtros, sucursal: esAdmin ? sucursal.id : undefined }} />
      ) : (
        <p className="text-arena-600">Elige una sucursal para ver su historial.</p>
      )}
    </>
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
    <div className="grid items-start gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <form
        aria-label="Filtros"
        className="grid gap-4 rounded-2xl bg-white p-5 shadow-suave ring-1 ring-arena-200/70 sm:grid-cols-2 lg:grid-cols-3 xl:sticky xl:top-8 xl:grid-cols-1"
      >
        {filtros.sucursal && <input type="hidden" name="sucursal" value={filtros.sucursal} />}
        <Fecha etiqueta="Desde" nombre="desde" valor={filtros.desde} />
        <Fecha etiqueta="Hasta" nombre="hasta" valor={filtros.hasta} />
        <Selector etiqueta="Estado" nombre="estado" valor={filtros.estado} vacio={null} opciones={OPCIONES_ESTADO} />
        <Selector etiqueta="Producto" nombre="producto" valor={filtros.producto} opciones={opcionesProductos} />
        <Selector etiqueta="Motivo" nombre="motivo" valor={filtros.motivo} opciones={opcionesMotivos} />
        <Selector etiqueta="Registró" nombre="usuario" valor={filtros.usuario} opciones={opcionesUsuarios} />
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-1">
          <button className={estiloBoton()}>
            <Icono nombre="filtro" className="size-4" /> Filtrar
          </button>
          <Link href={`/sucursal${aQuery({ sucursal: filtros.sucursal })}`} className={estiloBoton({ variante: "fantasma" })}>
            Limpiar filtros
          </Link>
        </div>
      </form>

      <div className="flex min-w-0 flex-col gap-4">
      {filtros.avisoFechas && <Aviso tono="alerta">{filtros.avisoFechas}</Aviso>}

      <p role="status" className="flex flex-wrap items-baseline gap-x-8 gap-y-1 px-1 text-arena-600">
        <span>
          <strong className="cifra text-2xl font-semibold text-arena-900">{totales.registros}</strong>{" "}
          {totales.registros === 1 ? "registro" : "registros"}
        </span>
        <span>
          <strong className="cifra text-2xl font-semibold text-frambuesa-700">{formatoPesos(totales.costoCentavos)}</strong>{" "}
          en mermas{filtros.estado !== "activos" && " (sin cancelados)"}
        </span>
      </p>

      <ListaMermas mermas={pagina.filas} mostrarUsuario columnas vacio="No hay registros con estos filtros." />
      <Paginacion
        pagina={filtros.pagina}
        haySiguiente={pagina.haySiguiente}
        href={(p) => `/sucursal${aQuery({ ...filtros, pagina: p })}`}
      />
      </div>
    </div>
  );
}

function SelectorSucursal({ sucursales, actual }: { sucursales: Opcion[]; actual?: number }) {
  return (
    <form className="flex gap-2">
      <label htmlFor="sucursal" className="sr-only">
        Sucursal
      </label>
      <select id="sucursal" name="sucursal" defaultValue={actual ?? ""} className="campo min-w-56" required>
        <option value="">Selecciona una sucursal…</option>
        {sucursales.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>
      <button className={estiloBoton({ variante: "secundario" })}>Ver</button>
    </form>
  );
}

function Fecha({ etiqueta, nombre, valor }: { etiqueta: string; nombre: string; valor?: string }) {
  return (
    <Campo id={`filtro-${nombre}`} etiqueta={etiqueta}>
      <input id={`filtro-${nombre}`} type="date" name={nombre} defaultValue={valor} className="campo" />
    </Campo>
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
    <Campo id={`filtro-${nombre}`} etiqueta={etiqueta}>
      <select id={`filtro-${nombre}`} name={nombre} defaultValue={valor ?? ""} className="campo">
        {vacio !== null && <option value="">{vacio}</option>}
        {opciones.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
    </Campo>
  );
}
