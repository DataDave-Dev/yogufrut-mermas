import { expect, type Page } from "@playwright/test";

export const PASSWORD = process.env.SEED_PASSWORD ?? "yogufrut123";

export async function entrar(page: Page, usuario: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  if (password === PASSWORD) await expect(page).not.toHaveURL(/\/login/);
}

export async function salir(page: Page) {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
}

export async function llenarMerma(page: Page, producto: string, cantidad: string, motivo: string) {
  await page.getByLabel("Producto", { exact: true }).selectOption({ label: producto });
  await page.getByLabel("Cantidad", { exact: true }).fill(cantidad);
  await page.getByLabel("Motivo", { exact: true }).selectOption({ label: motivo });
}

/** PNG de 1×1 px válido. */
export const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);
