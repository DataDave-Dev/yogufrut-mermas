import { expect, test, type Page } from "@playwright/test";

const PASSWORD = process.env.SEED_PASSWORD ?? "yogufrut123";

async function entrar(page: Page, usuario: string, password = PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("Usuario").fill(usuario);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

test("contraseña incorrecta no entra", async ({ page }) => {
  await entrar(page, "empleado", "incorrecta");
  await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test("sin sesión redirige al login", async ({ page }) => {
  await page.goto("/mis-registros");
  await expect(page).toHaveURL(/\/login$/);
});

test("empleado registra una merma y la ve en Mis registros", async ({ page }, info) => {
  const cantidad = info.project.name === "celular" ? "1.5" : "3";
  const costo = info.project.name === "celular" ? "$78.00" : "$156.00";

  await entrar(page, "empleado");
  await expect(page.getByText("Empleado · Sucursal Sendero")).toBeVisible();

  await page.getByLabel("Producto", { exact: true }).selectOption({ label: "Base de yogurt de fresa" });
  await expect(page.getByLabel("Unidad de medida")).toHaveText("L");
  await page.getByLabel("Cantidad", { exact: true }).fill(cantidad);
  await page.getByLabel("Motivo", { exact: true }).selectOption({ label: "Caducidad" });
  await page.getByLabel("Observaciones (opcional)").fill("Detectado en revisión");
  await page.getByRole("button", { name: "Guardar merma" }).click();

  await expect(page.getByRole("status")).toContainText(costo);
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("");

  await page.getByRole("link", { name: "Mis registros" }).click();
  const registro = page.getByRole("listitem").filter({ hasText: `Base de yogurt de fresa · ${cantidad} L` });
  await expect(registro).toContainText(costo);
  await expect(registro).toContainText("Caducidad");

  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/mis-registros");
  await expect(page).toHaveURL(/\/login$/);
});

test("cantidad inválida no se guarda", async ({ page }) => {
  await entrar(page, "encargado");
  await page.getByLabel("Producto", { exact: true }).selectOption({ label: "Leche entera" });
  await page.getByLabel("Cantidad", { exact: true }).fill("0");
  await page.getByLabel("Motivo", { exact: true }).selectOption({ label: "Derrame" });
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await expect(page.getByText("La cantidad debe ser mayor a 0")).toBeVisible();
});
