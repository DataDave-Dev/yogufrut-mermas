import Link from "next/link";
import { aQueryCatalogo, POR_PAGINA_CATALOGO, type FiltrosCatalogo as Filtros } from "@/lib/filtros-catalogo";
import { Paginacion } from "./Paginacion";
import { estiloBoton } from "./ui/boton";
import { Icono } from "./ui/Icono";

type Opcion = { id: string | number; nombre: string };
type Selector = { nombre: "rol" | "sucursal" | "categoria"; etiqueta: string; todos: string; opciones: Opcion[] };

type Props = { ruta: string; filtros: Filtros; marcador: string; selectores?: Selector[] };

const OPCIONES_ESTADO: Opcion[] = [
  { id: "todos", nombre: "Estado: todos" },
  { id: "activos", nombre: "Estado: activo" },
  { id: "inactivos", nombre: "Estado: inactivo" },
];

/** Búsqueda y filtros de una lista de administración; viajan en la URL (formulario GET). */
export function FiltrosCatalogo({ ruta, filtros, marcador, selectores = [] }: Props) {
  const hayFiltros = aQueryCatalogo({ ...filtros, pagina: 1 }) !== "";
  return (
    <form action={ruta} role="search" className="flex flex-wrap items-center gap-2 border-t border-arena-100 px-5 py-4">
      <input
        type="search"
        name="q"
        aria-label="Buscar"
        placeholder={marcador}
        defaultValue={filtros.q}
        maxLength={80}
        className="campo min-w-48 flex-1 py-2"
      />
      {selectores.map((s) => (
        <select key={s.nombre} name={s.nombre} aria-label={s.etiqueta} defaultValue={filtros[s.nombre] ?? ""} className="campo w-auto py-2">
          <option value="">{s.todos}</option>
          {s.opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nombre}
            </option>
          ))}
        </select>
      ))}
      <select name="estado" aria-label="Filtrar por estado" defaultValue={filtros.estado} className="campo w-auto py-2">
        {OPCIONES_ESTADO.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nombre}
          </option>
        ))}
      </select>
      <button className={estiloBoton({ variante: "secundario", tamano: "sm" })}>
        <Icono nombre="filtro" className="size-4" /> Filtrar
      </button>
      {hayFiltros && (
        <Link href={ruta} className={estiloBoton({ variante: "fantasma", tamano: "sm" })}>
          Limpiar
        </Link>
      )}
    </form>
  );
}

/** Mensaje de lista vacía por filtros. */
export function SinCoincidencias() {
  return <p className="border-t border-arena-100 px-5 py-8 text-center text-arena-500">Nada coincide con la búsqueda o los filtros.</p>;
}

/** Paginación al pie de la lista; no ocupa espacio si todo cabe en una página. */
export function PaginacionCatalogo({ ruta, filtros, total }: { ruta: string; filtros: Filtros; total: number }) {
  const haySiguiente = filtros.pagina * POR_PAGINA_CATALOGO < total;
  if (filtros.pagina === 1 && !haySiguiente) return null;
  return (
    <div className="border-t border-arena-100 px-5 py-4">
      <Paginacion pagina={filtros.pagina} haySiguiente={haySiguiente} href={(p) => `${ruta}${aQueryCatalogo({ ...filtros, pagina: p })}`} />
    </div>
  );
}
