import { Insignia } from "./ui/Insignia";

export function Estado({ activo, textoInactivo = "Inactivo" }: { activo: boolean; textoInactivo?: string }) {
  return activo ? null : <Insignia>{textoInactivo}</Insignia>;
}
