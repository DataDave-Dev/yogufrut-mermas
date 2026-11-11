import { expect, test } from "@playwright/test";
import { entrar } from "./utilidades";

test("contraseña incorrecta no entra", async ({ page }) => {
  await entrar(page, "empleado", "incorrecta");
  await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel("Usuario")).toHaveValue("empleado");
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
  await expect(page.getByLabel("Producto", { exact: true })).toHaveValue("");
  await expect(page.getByLabel("Unidad de medida")).toHaveText("—");

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
  // Lo capturado se conserva para corregir solo la cantidad.
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("0");
  await expect(page.getByLabel("Producto", { exact: true }).locator("option:checked")).toHaveText("Leche entera");
  await expect(page.getByLabel("Unidad de medida")).toHaveText("L");
  await expect(page.getByLabel("Motivo", { exact: true }).locator("option:checked")).toHaveText("Derrame");
});
