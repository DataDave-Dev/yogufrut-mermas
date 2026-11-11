import { expect, test } from "@playwright/test";
import { entrar, llenarMerma, PNG_1PX, salir } from "./utilidades";

test("foto, aviso de duplicado y cancelación por el gerente", async ({ page }, info) => {
  // Cantidad distinta por proyecto: ambos comparten base de datos y el aviso de duplicado.
  const cantidad = info.project.name === "celular" ? "2.25" : "1.25";
  const registro = `Kiwi · ${cantidad} kg`;

  // Empleado registra con foto.
  await entrar(page, "empleado");
  await llenarMerma(page, "Kiwi", cantidad, "Producto dañado");
  await page.getByLabel("Foto de evidencia (opcional)").setInputFiles({
    name: "kiwi.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await expect(page.getByRole("status")).toContainText("Kiwi");

  // Mismo producto y cantidad: aviso; descartar no guarda nada.
  await llenarMerma(page, "Kiwi", cantidad, "Producto dañado");
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("hace menos de 5 minutos");
  await page.getByRole("button", { name: "No, descartar" }).click();
  await expect(page.getByRole("alertdialog")).toBeHidden();
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("");

  // Repetir y confirmar sí guarda.
  await llenarMerma(page, "Kiwi", cantidad, "Producto dañado");
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await page.getByRole("button", { name: "Sí, guardar" }).click();
  await expect(page.getByRole("status")).toContainText("Kiwi");

  await page.getByRole("link", { name: "Mis registros" }).click();
  await expect(page.getByRole("listitem").filter({ hasText: registro })).toHaveCount(2);
  await salir(page);

  // Gerente ve los registros de su sucursal con el nombre de quien registró.
  await entrar(page, "gerente");
  await page.getByRole("link", { name: "Registros de la sucursal" }).click();
  const conFoto = page.getByRole("listitem").filter({ hasText: registro }).filter({ hasText: "📷" });
  await expect(conFoto).toContainText("Ana López");

  // Detalle con foto y cancelación con motivo.
  await conFoto.getByRole("link").click();
  const foto = page.getByRole("img", { name: /Foto de evidencia/ });
  await expect(foto).toBeVisible();
  expect(await foto.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Cancelar registro" }).click();
  await page.getByLabel("Motivo de la cancelación").fill("Capturado dos veces");
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(page.getByText(/Cancelado por Laura Martínez/)).toContainText("Capturado dos veces");
  await expect(page.getByRole("button", { name: "Cancelar registro" })).toBeHidden();
  const urlDetalle = page.url();
  await salir(page);

  // El empleado lo ve cancelado; otro usuario de la sucursal no puede abrir el detalle ni la foto.
  await entrar(page, "empleado");
  await page.goto("/mis-registros");
  await expect(page.getByRole("listitem").filter({ hasText: registro }).filter({ hasText: "Cancelado" })).toHaveCount(1);
  await page.goto(urlDetalle);
  await expect(page.getByRole("button", { name: "Cancelar registro" })).toBeHidden();
  await salir(page);

  await entrar(page, "encargado");
  await page.goto(urlDetalle);
  await expect(page.getByRole("heading", { name: "No encontrado" })).toBeVisible();
  const respuestaFoto = await page.request.get(`${urlDetalle}/foto`);
  expect(respuestaFoto.status()).toBe(404);
});

test("empleado no accede a registros de la sucursal", async ({ page }) => {
  await entrar(page, "empleado");
  await expect(page.getByRole("link", { name: "Registros de la sucursal" })).toBeHidden();
  await page.goto("/sucursal");
  await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
});

test("archivo que no es imagen se rechaza", async ({ page }) => {
  await entrar(page, "encargado");
  await llenarMerma(page, "Mango", "1", "Caducidad");
  await page.getByLabel("Foto de evidencia (opcional)").setInputFiles({
    name: "factura.png",
    mimeType: "image/png",
    buffer: Buffer.from("%PDF-1.4 no es una imagen"),
  });
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await expect(page.getByText("La foto debe ser JPEG, PNG o WebP")).toBeVisible();
  await expect(page.getByLabel("Cantidad", { exact: true })).toHaveValue("1");
});

test("administrador elige la sucursal a revisar", async ({ page }) => {
  await entrar(page, "admin");
  await page.getByRole("link", { name: "Registros por sucursal" }).click();
  await page.getByLabel("Sucursal").selectOption({ label: "Sucursal Sendero" });
  await page.getByRole("button", { name: "Ver" }).click();
  await expect(page.getByRole("heading", { name: "Registros de Sucursal Sendero" })).toBeVisible();
  await expect(page.getByRole("listitem").first()).toBeVisible();
});

test("freno tras 5 intentos fallidos", async ({ page }, info) => {
  const usuario = `intruso-${info.project.name}`;
  for (let i = 0; i < 5; i++) {
    await entrar(page, usuario, "incorrecta");
    await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
  }
  await entrar(page, usuario, "incorrecta");
  await expect(page.getByText(/Demasiados intentos fallidos/)).toBeVisible();
});
