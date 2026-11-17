import ExcelJS from "exceljs";
import { expect, test } from "@playwright/test";
import { entrar, llenarMerma, navegar, salir } from "./utilidades";

test("gerente descarga el Excel del mes y abre la vista imprimible", async ({ page }, info) => {
  const producto = info.project.name === "celular" ? "Durazno" : "Piña";
  await entrar(page, "empleado");
  await llenarMerma(page, producto, "1.5", "Temperatura inadecuada");
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await expect(page.getByRole("status")).toContainText(producto);
  await salir(page);

  await entrar(page, "gerente");
  await navegar(page, "Reportes");

  const [descarga] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Descargar Excel" }).click()]);
  expect(descarga.suggestedFilename()).toMatch(/^mermas-sucursal-sendero-\d{4}-\d{2}\.xlsx$/);
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.readFile(await descarga.path());
  expect(libro.worksheets.map((h) => h.name)).toEqual(["Resumen", "Registros"]);
  expect(libro.getWorksheet("Resumen")!.getCell("B2").value).toBe("Sucursal Sendero");
  const registros = libro.getWorksheet("Registros")!;
  const productos = registros.getColumn(5).values;
  expect(productos).toContain(producto);

  // El botón de PDF abre la vista imprimible en otra pestaña con impresión automática.
  const imprimir = page.getByRole("link", { name: "Exportar PDF" });
  await expect(imprimir).toHaveAttribute("target", "_blank");
  await expect(imprimir).toHaveAttribute("href", /imprimir=1/);

  // La vista (sin impresión automática) muestra resumen y registros, sin el menú lateral.
  await page.goto("/reportes/imprimir?tipo=mes");
  await expect(page.getByRole("heading", { name: "Sucursal Sendero" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Registros del periodo" })).toBeVisible();
  await expect(page.getByRole("cell", { name: new RegExp(producto) }).first()).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Principal" })).toHaveCount(0);
});

test("encargado no puede exportar", async ({ page }) => {
  await entrar(page, "encargado");
  await navegar(page, "Reportes");
  await expect(page.getByRole("link", { name: "Descargar Excel" })).toHaveCount(0);
  expect((await page.request.get("/reportes/excel?tipo=mes")).status()).toBe(403);
  await page.goto("/reportes/imprimir");
  await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
});

test("sin sesión no hay descarga", async ({ request }) => {
  expect((await request.get("/reportes/excel")).status()).toBe(401);
});
