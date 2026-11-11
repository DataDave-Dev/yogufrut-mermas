export const FOTO_MAX_BYTES = 5 * 1024 * 1024;
export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"] as const;
export type TipoFoto = (typeof TIPOS_FOTO)[number];

/**
 * Tipo real de la imagen según sus primeros bytes. No se confía en el tipo que declara el navegador.
 * null si no es JPEG, PNG ni WebP.
 */
export function detectarTipoFoto(bytes: Uint8Array): TipoFoto | null {
  const empieza = (firma: number[], desde = 0) => firma.every((b, i) => bytes[desde + i] === b);
  if (empieza([0xff, 0xd8, 0xff])) return "image/jpeg";
  if (empieza([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (empieza([0x52, 0x49, 0x46, 0x46]) && empieza([0x57, 0x45, 0x42, 0x50], 8)) return "image/webp";
  return null;
}
