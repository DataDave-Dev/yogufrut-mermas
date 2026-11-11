"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Icono } from "../ui/Icono";
import { COOKIE_SIDEBAR, estaActivo, type GrupoMenu } from "./menu";

type Usuario = { nombre: string; puesto: string; sucursal: string | null };

type Props = {
  menu: GrupoMenu[];
  usuario: Usuario;
  /** Leído de la cookie en el servidor: evita el parpadeo al cargar. */
  colapsadoInicial: boolean;
  salir: () => Promise<void>;
  children: ReactNode;
};

const UN_ANIO = 60 * 60 * 24 * 365;

export function AppShell({ menu, usuario, colapsadoInicial, salir, children }: Props) {
  const ruta = usePathname();
  const [colapsado, setColapsado] = useState(colapsadoInicial);
  const [abiertoMovil, setAbiertoMovil] = useState(false);
  const [rutaAbierta, setRutaAbierta] = useState(ruta);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const cajon = useRef<HTMLDivElement>(null);

  // Navegar cierra el cajón móvil (estado derivado de la ruta, sin efecto).
  if (rutaAbierta !== ruta) {
    setRutaAbierta(ruta);
    setAbiertoMovil(false);
  }

  function alternarColapso() {
    const nuevo = !colapsado;
    setColapsado(nuevo);
    document.cookie = `${COOKIE_SIDEBAR}=${nuevo ? "colapsado" : "abierto"}; path=/; max-age=${UN_ANIO}; samesite=lax`;
  }

  // Cajón móvil abierto: Escape cierra, la página no se desplaza y el foco entra al cajón.
  useEffect(() => {
    if (!abiertoMovil) return;
    const boton = botonMenu.current;
    const alPresionar = (ev: KeyboardEvent) => ev.key === "Escape" && setAbiertoMovil(false);
    document.addEventListener("keydown", alPresionar);
    document.body.style.overflow = "hidden";
    cajon.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => {
      document.removeEventListener("keydown", alPresionar);
      document.body.style.overflow = "";
      boton?.focus();
    };
  }, [abiertoMovil]);

  return (
    <div className="min-h-dvh">
      {/* Barra superior en celular y tablet. */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-arena-200/80 bg-arena-50/85 px-4 py-2.5 backdrop-blur-md lg:hidden">
        <Marca />
        <button
          ref={botonMenu}
          type="button"
          onClick={() => setAbiertoMovil(true)}
          aria-expanded={abiertoMovil}
          aria-controls="menu-lateral"
          className="grid size-10 place-items-center rounded-xl text-arena-700 transition hover:bg-arena-100 focus-visible:ring-4 focus-visible:ring-frambuesa-100 focus-visible:outline-none"
        >
          <Icono nombre="menu" className="size-6" />
          <span className="sr-only">Abrir menú</span>
        </button>
      </header>

      {/* Fondo oscurecido del cajón móvil. */}
      <div
        aria-hidden
        onClick={() => setAbiertoMovil(false)}
        className={`fixed inset-0 z-40 bg-arena-900/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          abiertoMovil ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id="menu-lateral"
        ref={cajon}
        role={abiertoMovil ? "dialog" : undefined}
        aria-modal={abiertoMovil || undefined}
        aria-label="Menú"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-arena-900 text-arena-200 shadow-2xl transition-[transform,width,visibility] duration-300 ease-out lg:z-30 lg:translate-x-0 lg:shadow-none ${
          // Cerrado en celular: fuera de pantalla e invisible (fuera del orden de tabulación).
          abiertoMovil ? "translate-x-0" : "max-lg:invisible -translate-x-full"
        } ${colapsado ? "lg:w-[4.75rem]" : "lg:w-64"}`}
      >
        <BarraLateral
          menu={menu}
          ruta={ruta}
          usuario={usuario}
          colapsado={colapsado}
          salir={salir}
          alCerrarMovil={() => setAbiertoMovil(false)}
          alAlternarColapso={alternarColapso}
        />
      </div>

      <div className={`transition-[padding] duration-300 ease-out ${colapsado ? "lg:pl-[4.75rem]" : "lg:pl-64"}`}>
        <main id="contenido" className="mx-auto flex w-full max-w-[110rem] flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 lg:px-8 lg:pt-8 2xl:px-12">
          {children}
        </main>
      </div>
    </div>
  );
}

type BarraProps = {
  menu: GrupoMenu[];
  ruta: string;
  usuario: Usuario;
  colapsado: boolean;
  salir: () => Promise<void>;
  alCerrarMovil: () => void;
  alAlternarColapso: () => void;
};

function BarraLateral({ menu, ruta, usuario, colapsado, salir, alCerrarMovil, alAlternarColapso }: BarraProps) {
  // En celular nunca está colapsado; el modo compacto es solo de escritorio.
  const compacto = colapsado ? "lg:hidden" : "";

  return (
    <>
      <div className="flex h-16 shrink-0 items-center justify-between gap-2 px-4">
        <Marca oscura ocultarTexto={colapsado} />
        <button
          type="button"
          onClick={alCerrarMovil}
          className="grid size-9 place-items-center rounded-lg text-arena-400 transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-frambuesa-300 focus-visible:outline-none lg:hidden"
        >
          <Icono nombre="cerrar" />
          <span className="sr-only">Cerrar menú</span>
        </button>
      </div>

      <nav aria-label="Principal" className="flex-1 overflow-y-auto px-3 pb-4">
        {menu.map((grupo) => (
          <div key={grupo.titulo} className="mt-5 first:mt-2">
            <p className={`mb-1.5 px-3 text-[0.6875rem] font-semibold tracking-wider text-arena-500 uppercase ${compacto}`}>
              {grupo.titulo}
            </p>
            {colapsado && <div aria-hidden className="mx-3 mb-2 hidden h-px bg-white/10 lg:block" />}
            <ul className="flex flex-col gap-0.5">
              {grupo.elementos.map((e) => {
                const activo = estaActivo(e.href, ruta);
                return (
                  <li key={e.href}>
                    <Link
                      href={e.href}
                      aria-current={activo ? "page" : undefined}
                      title={colapsado ? e.texto : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-frambuesa-300 focus-visible:outline-none ${
                        activo ? "bg-white/10 text-white" : "text-arena-300 hover:bg-white/5 hover:text-white"
                      } ${colapsado ? "lg:justify-center lg:px-0" : ""}`}
                    >
                      {activo && <span aria-hidden className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-frambuesa-400" />}
                      <Icono
                        nombre={e.icono}
                        className={`size-5 shrink-0 transition ${activo ? "text-frambuesa-300" : "text-arena-500 group-hover:text-arena-300"}`}
                      />
                      <span className={`truncate ${compacto}`}>{e.texto}</span>
                      {colapsado && <span className="sr-only">{e.texto}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className={`flex items-center gap-3 rounded-xl px-2 py-2 ${colapsado ? "lg:justify-center lg:px-0" : ""}`}>
          <span
            aria-hidden
            title={colapsado ? `${usuario.nombre} · ${usuario.puesto}` : undefined}
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-frambuesa-600 text-sm font-semibold text-white"
          >
            {iniciales(usuario.nombre)}
          </span>
          <div className={`min-w-0 flex-1 leading-tight ${compacto}`}>
            <p className="truncate text-sm font-semibold text-white">{usuario.nombre}</p>
            <p className="truncate text-xs text-arena-400">
              {usuario.puesto}
              {usuario.sucursal && ` · ${usuario.sucursal}`}
            </p>
          </div>
        </div>
        <div className={`mt-1 flex gap-1 ${colapsado ? "lg:flex-col" : ""}`}>
          <form action={salir} className="flex-1">
            <button
              title={colapsado ? "Cerrar sesión" : undefined}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-arena-300 transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-frambuesa-300 focus-visible:outline-none"
            >
              <Icono nombre="salir" className="size-4" />
              <span className={compacto}>Cerrar sesión</span>
              {colapsado && <span className="sr-only">Cerrar sesión</span>}
            </button>
          </form>
          <button
            type="button"
            onClick={alAlternarColapso}
            aria-pressed={colapsado}
            title={colapsado ? "Expandir menú" : "Contraer menú"}
            className="hidden place-items-center rounded-xl px-3 py-2 text-arena-400 transition hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-frambuesa-300 focus-visible:outline-none lg:grid"
          >
            <Icono nombre={colapsado ? "expandir" : "contraer"} className="size-4" />
            <span className="sr-only">{colapsado ? "Expandir menú" : "Contraer menú"}</span>
          </button>
        </div>
      </div>
    </>
  );
}

function Marca({ oscura = false, ocultarTexto = false }: { oscura?: boolean; ocultarTexto?: boolean }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-frambuesa-300 focus-visible:outline-none"
    >
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-xl bg-frambuesa-600 font-display text-lg font-bold text-white shadow-acento">
        Y
      </span>
      <span className={`leading-tight ${ocultarTexto ? "lg:sr-only" : ""}`}>
        <span className={`block font-display font-semibold ${oscura ? "text-white" : "text-arena-900"}`}>Yogufrut</span>
        <span className={`block text-xs ${oscura ? "text-arena-400" : "text-arena-500"}`}>Control de mermas</span>
      </span>
    </Link>
  );
}

const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
