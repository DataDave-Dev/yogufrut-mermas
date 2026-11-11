import { expect, test } from "@playwright/test";
import { entrar, filas, llenarMerma, navegar, salir } from "./utilidades";

test("panel del día con rankings, cancelados excluidos y enlace al historial", async ({ page }, info) => {
  // Producto distinto por proyecto: ambos comparten la base de pruebas.
  const producto = info.project.name === "celular" ? "Melón" : "Papaya";

  await entrar(page, "empleado");
  for (const cantidad of ["1", "2"]) {
    await llenarMerma(page, producto, cantidad, "Sobrante");
    await page.getByRole("button", { name: "Guardar merma" }).click();
    await expect(page.getByRole("status")).toContainText(`${cantidad} kg de ${producto}`);
  }
  await salir(page);

  // El gerente cancela la de 2 kg.
  await entrar(page, "gerente");
  await navegar(page, "Historial");
  await filas(page).filter({ hasText: `${producto} · 2 kg` }).getByRole("link").click();
  await page.getByRole("button", { name: "Cancelar registro" }).click();
  await page.getByLabel("Motivo de la cancelación").fill("Prueba de reportes");
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(page.getByText(/Cancelado por/)).toBeVisible();

  // Panel del día: el producto aparece con 1 registro y el costo de 1 kg ($25.00).
  await navegar(page, "Reportes");
  await expect(page.getByRole("heading", { name: "Sucursal Sendero" })).toBeVisible();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await expect(page.getByRole("link", { name: "Día", exact: true })).toHaveAttribute("aria-current", "page");
  const productos = page.getByRole("region", { name: "Productos con más merma" });
  const fila = productos.getByRole("listitem").filter({ hasText: producto });
  await expect(fila).toContainText("$25.00");
  await expect(fila).toContainText("1 registro · 1 kg");
  await expect(page.getByRole("region", { name: "Registros por empleado" })).toContainText("Ana López");

  // Del ranking al historial filtrado por el producto y el periodo.
  await fila.getByRole("link").click();
  await expect(page).toHaveURL(/producto=\d+/);
  await expect(filas(page)).toHaveCount(1);

  // Periodo anterior sin datos.
  await navegar(page, "Reportes");
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await page.getByRole("link", { name: "Periodo anterior" }).click();
  await expect(page.getByText("No hay registros en este periodo.")).toBeVisible();
});

test("administrador ve el resumen general y entra al panel de una sucursal", async ({ page }) => {
  await entrar(page, "admin");
  await navegar(page, "Reportes");
  await expect(page.getByRole("heading", { name: "Resumen general" })).toBeVisible();
  const tabla = page.getByRole("table");
  await expect(tabla.getByRole("rowheader", { name: /Sucursal Sendero/ })).toBeVisible();
  await expect(tabla.getByRole("rowheader", { name: "Total" })).toBeVisible();
  await tabla.getByRole("link", { name: "Sucursal Sendero" }).click();
  await expect(page.getByRole("heading", { name: "Sucursal Sendero" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Resumen general" })).toBeVisible();
});

test("encargado ve reportes pero no el resumen general", async ({ page }) => {
  await entrar(page, "encargado");
  await navegar(page, "Reportes");
  await expect(page.getByRole("heading", { name: "Sucursal Sendero" })).toBeVisible();
  await page.goto("/reportes/general");
  await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
});
