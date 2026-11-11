export function Estado({ activo, textoInactivo = "Inactivo" }: { activo: boolean; textoInactivo?: string }) {
  return activo ? null : (
    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-medium text-stone-600">{textoInactivo}</span>
  );
}
