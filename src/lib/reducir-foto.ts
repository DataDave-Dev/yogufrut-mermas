const LADO_MAX = 1600;

/**
 * Reduce una foto en el navegador a WebP de máximo 1600 px por lado.
 * Si el navegador no puede procesarla, devuelve el archivo original (el servidor la valida igual).
 */
export async function reducirFoto(archivo: File): Promise<Blob> {
  try {
    const imagen = await createImageBitmap(archivo, { imageOrientation: "from-image" });
    const escala = Math.min(1, LADO_MAX / Math.max(imagen.width, imagen.height));
    const lienzo = document.createElement("canvas");
    lienzo.width = Math.round(imagen.width * escala);
    lienzo.height = Math.round(imagen.height * escala);
    lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    imagen.close();
    const webp = await new Promise<Blob | null>((ok) => lienzo.toBlob(ok, "image/webp", 0.8));
    return webp && webp.size < archivo.size ? webp : archivo;
  } catch {
    return archivo;
  }
}
