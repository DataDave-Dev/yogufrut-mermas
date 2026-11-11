import { expect, test } from "@playwright/test";
import { entrar, filas, llenarMerma, navegar, salir } from "./utilidades";

test("encargado filtra el historial, ve totales y abre un detalle", async ({ page }, info) => {
  // Producto distinto por proyecto: ambos comparten la base de pruebas.
  const producto = info.project.name === "celular" ? "Manzana" : "Uva";
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Monterrey" }).format(new Date());
  const manana = new Date(Date.parse(`${hoy}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

  await entrar(page, "empleado");
  for (const [cantidad, motivo] of [["1", "Caducidad"], ["2", "Derrame"], ["3", "Caducidad"]]) {
    await llenarMerma(page, producto, cantidad, motivo);
    await page.getByRole("button", { name: "Guardar merma" }).click();
    await expect(page.getByRole("status")).toContainText(`${cantidad} kg de ${producto}`);
  }
  await salir(page);

  await entrar(page, "encargado");
  await navegar(page, "Historial");
  await expect(page.getByRole("heading", { name: "Historial de Sucursal Sendero" })).toBeVisible();

  // Producto + motivo + rango de hoy.
  await page.getByLabel("Producto").selectOption({ label: producto });
  await page.getByLabel("Motivo").selectOption({ label: "Caducidad" });
  await page.getByLabel("Desde").fill(hoy);
  await page.getByLabel("Hasta").fill(hoy);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page).toHaveURL(/motivo=\d+/);
  const kilo = producto === "Uva" ? 6000 : 4500;
  const esperado = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format((kilo * 4) / 100);
  await expect(page.getByRole("status")).toContainText("2 registros");
  await expect(page.getByRole("status")).toContainText(esperado);
  await expect(filas(page)).toHaveCount(2);
  await expect(filas(page).first()).toContainText("Ana López");

  // La URL filtrada se puede recargar.
  await page.reload();
  await expect(filas(page)).toHaveCount(2);

  // Desde mañana: nada.
  await page.getByLabel("Desde").fill(manana);
  await page.getByLabel("Hasta").fill(manana);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByText("No hay registros con estos filtros.")).toBeVisible();

  // Fechas invertidas: aviso y sin rango.
  await page.getByLabel("Desde").fill(manana);
  await page.getByLabel("Hasta").fill(hoy);
  await page.getByRole("button", { name: "Filtrar" }).click();
  await expect(page.getByRole("alert")).toContainText("posterior");
  await expect(filas(page)).toHaveCount(2);

  // Detalle desde el historial.
  await filas(page).first().getByRole("link").click();
  await expect(page.getByRole("heading", { name: producto })).toBeVisible();
  await expect(page.getByText("Ana López (Empleado)")).toBeVisible();
});

test("gerente no puede consultar otra sucursal por URL", async ({ page }) => {
  await entrar(page, "gerente");
  await page.goto("/sucursal?sucursal=9999");
  await expect(page.getByRole("heading", { name: "Historial de Sucursal Sendero" })).toBeVisible();
  await expect(page.getByLabel("Sucursal")).toHaveCount(0);
});
