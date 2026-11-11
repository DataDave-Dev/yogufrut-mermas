import Link from "next/link";

type Props = { pagina: number; haySiguiente: boolean; href: (pagina: number) => string };

export function Paginacion({ pagina, haySiguiente, href }: Props) {
  if (pagina === 1 && !haySiguiente) return null;
  const clase = "rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-stone-300 hover:bg-stone-100";
  return (
    <nav aria-label="Paginación" className="mt-4 flex items-center justify-between">
      {pagina > 1 ? <Link href={href(pagina - 1)} className={clase}>← Anteriores</Link> : <span />}
      <span className="text-sm text-stone-500">Página {pagina}</span>
      {haySiguiente ? <Link href={href(pagina + 1)} className={clase}>Siguientes →</Link> : <span />}
    </nav>
  );
}
