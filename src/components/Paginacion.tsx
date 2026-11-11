import Link from "next/link";
import { estiloBoton } from "./ui/boton";
import { Icono } from "./ui/Icono";

type Props = { pagina: number; haySiguiente: boolean; href: (pagina: number) => string };

export function Paginacion({ pagina, haySiguiente, href }: Props) {
  if (pagina === 1 && !haySiguiente) return null;
  const estilo = estiloBoton({ variante: "secundario", tamano: "sm" });
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between">
      {pagina > 1 ? (
        <Link href={href(pagina - 1)} className={estilo}>
          <Icono nombre="izquierda" className="size-4" /> Anteriores
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-arena-500">Página {pagina}</span>
      {haySiguiente ? (
        <Link href={href(pagina + 1)} className={estilo}>
          Siguientes <Icono nombre="derecha" className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
