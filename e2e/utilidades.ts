import { expect, type Page } from "@playwright/test";

export const PASSWORD = process.env.SEED_PASSWORD ?? "yogufrut123";

export async function entrar(page: Page, usuario: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  if (password === PASSWORD) await expect(page).not.toHaveURL(/\/login/);
}

/** Abre el cajón del menú si está cerrado (celular); en escritorio el sidebar ya está visible. */
async function abrirMenuSiHaceFalta(page: Page) {
  const abrir = page.getByRole("button", { name: "Abrir menú" });
  if (await abrir.isVisible()) await abrir.click();
}

/** Navega con el menú lateral. */
export async function navegar(page: Page, texto: string) {
  await abrirMenuSiHaceFalta(page);
  const menu = page.getByRole("navigation", { name: "Principal" });
  await menu.getByRole("link", { name: texto, exact: true }).click();
  // En celular el cajón se cierra al navegar: el enlace queda oculto, así que se comprueba por atributo, sin exigir que sea visible.
  await expect(page.locator('nav a[aria-current="page"]').filter({ hasText: texto })).toHaveCount(1);
}

export async function salir(page: Page) {
  await abrirMenuSiHaceFalta(page);
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

/** Elementos de lista del contenido (sin los del menú lateral). */
export const filas = (page: Page) => page.getByRole("main").getByRole("listitem");

export async function llenarMerma(page: Page, producto: string, cantidad: string, motivo: string) {
  if (!page.url().endsWith("/registrar")) await page.goto("/registrar");
  await page.getByLabel("Producto", { exact: true }).selectOption({ label: producto });
  await page.getByLabel("Cantidad", { exact: true }).fill(cantidad);
  await page.getByLabel("Motivo", { exact: true }).selectOption({ label: motivo });
}

/** PNG de 1×1 px válido. */
export const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
