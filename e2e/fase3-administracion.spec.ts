import { expect, test, type Page } from "@playwright/test";
import { entrar, llenarMerma, PASSWORD, salir } from "./utilidades";

async function crearUsuario(page: Page, datos: { nombre: string; usuario: string; password: string; puesto: string; sucursal?: string }) {
  const formulario = page.locator("form").filter({ has: page.getByRole("button", { name: "Crear usuario" }) });
  await formulario.getByLabel("Nombre completo").fill(datos.nombre);
  await formulario.getByLabel("Usuario").fill(datos.usuario);
  await formulario.getByLabel("Contraseña inicial").fill(datos.password);
  await formulario.getByLabel("Puesto").selectOption({ label: datos.puesto });
  if (datos.sucursal) await formulario.getByLabel("Sucursal").selectOption({ label: datos.sucursal });
  await formulario.getByRole("button", { name: "Crear usuario" }).click();
  await expect(formulario.getByRole("status")).toContainText(`Usuario «${datos.usuario}» creado`);
}

function fila(page: Page, texto: string) {
  return page.getByRole("listitem").filter({ hasText: texto });
}

test("alta de sucursal y personal, registro, cambio de costo y desactivación", async ({ page }, info) => {
  const sufijo = info.project.name;
  const sucursal = `Sucursal Cumbres ${sufijo}`;
  const producto = `Producto prueba ${sufijo}`;
  const gerente = `gerente-cumbres-${sufijo}`;
  const empleado = `empleado-cumbres-${sufijo}`;

  // Administrador: sucursal, producto y gerente.
  await entrar(page, "admin");
  await expect(page).toHaveURL(/\/sucursal$/);
  await page.getByRole("link", { name: "Sucursales" }).click();
  await page.getByLabel("Nombre", { exact: true }).first().fill(sucursal);
  await page.getByRole("button", { name: "Crear sucursal" }).click();
  await expect(fila(page, sucursal)).toBeVisible();

  await page.getByLabel("Nombre", { exact: true }).first().fill(sucursal.toUpperCase());
  await page.getByRole("button", { name: "Crear sucursal" }).click();
  await expect(page.getByText("Ya existe una sucursal con ese nombre")).toBeVisible();

  await page.getByRole("link", { name: "Productos" }).click();
  const nuevoProducto = page.locator("form").filter({ has: page.getByRole("button", { name: "Crear producto" }) });
  await nuevoProducto.getByLabel("Nombre").fill(producto);
  await nuevoProducto.getByLabel("Categoría").fill("Pruebas");
  await nuevoProducto.getByLabel("Unidad").selectOption("pz");
  await nuevoProducto.getByLabel("Costo unitario (MXN)").fill("10.00");
  await nuevoProducto.getByRole("button", { name: "Crear producto" }).click();
  await expect(nuevoProducto.getByRole("status")).toContainText("creado");

  await page.getByRole("link", { name: "Usuarios" }).click();
  await crearUsuario(page, { nombre: "Gerente Cumbres", usuario: gerente, password: PASSWORD, puesto: "Gerente", sucursal });
  await salir(page);

  // Gerente: crea un empleado y le cambia la contraseña.
  await entrar(page, gerente);
  await page.getByRole("link", { name: "Usuarios" }).click();
  await expect(page.getByRole("heading", { name: `Usuarios de ${sucursal}` })).toBeVisible();
  const puestos = page.getByLabel("Puesto").first().locator("option");
  await expect(puestos).toHaveText(["Selecciona…", "Empleado", "Encargado de turno"]);
  await crearUsuario(page, { nombre: "Pedro Ramírez", usuario: empleado, password: "temporal123", puesto: "Empleado" });

  const filaEmpleado = fila(page, empleado);
  await filaEmpleado.getByText(`Editar ${empleado}`).click();
  await filaEmpleado.getByLabel("Nueva contraseña").fill("nueva-clave-1");
  await filaEmpleado.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(filaEmpleado.getByRole("status")).toContainText("Contraseña actualizada");

  await page.goto("/admin/productos");
  await expect(page.getByRole("heading", { name: "Acceso denegado" })).toBeVisible();
  await page.goto("/usuarios");
  await salir(page);

  // Empleado: la contraseña vieja ya no sirve; con la nueva registra una merma.
  await entrar(page, empleado, "temporal123");
  await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
  await entrar(page, empleado, "nueva-clave-1");
  await expect(page.getByText(`Empleado · ${sucursal}`)).toBeVisible();
  await llenarMerma(page, producto, "3", "Caducidad");
  await page.getByRole("button", { name: "Guardar merma" }).click();
  await expect(page.getByRole("status")).toContainText("$30.00");
  await salir(page);

  // Administrador: el nuevo costo no cambia la merma ya registrada.
  await entrar(page, "admin");
  await page.getByRole("link", { name: "Productos" }).click();
  const filaProducto = fila(page, producto);
  await filaProducto.getByText(`Editar ${producto}`).click();
  await filaProducto.getByLabel("Costo unitario (MXN)").fill("20.00");
  await filaProducto.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(filaProducto.getByRole("status")).toContainText("Cambios guardados");
  await page.goto("/sucursal");
  await page.getByLabel("Sucursal").selectOption({ label: sucursal });
  await page.getByRole("button", { name: "Ver" }).click();
  await expect(fila(page, `${producto} · 3 pz`)).toContainText("$30.00");

  // Desactivar la sucursal deja fuera a su personal.
  await page.getByRole("link", { name: "Sucursales" }).click();
  const filaSucursal = fila(page, sucursal);
  await filaSucursal.getByText(`Editar ${sucursal}`).click();
  await filaSucursal.getByRole("button", { name: "Desactivar sucursal" }).click();
  await expect(filaSucursal.getByText("Desactivada", { exact: true })).toBeVisible();
  await salir(page);

  await entrar(page, empleado, "nueva-clave-1");
  await expect(page.getByText("Usuario o contraseña incorrectos")).toBeVisible();
});

test("desactivar un usuario cierra su sesión abierta", async ({ browser }, info) => {
  const usuario = `encargado-temp-${info.project.name}`;
  const admin = await (await browser.newContext()).newPage();
  await entrar(admin, "admin");
  await admin.goto("/usuarios");
  await crearUsuario(admin, {
    nombre: "Encargado Temporal",
    usuario,
    password: PASSWORD,
    puesto: "Encargado de turno",
    sucursal: "Sucursal Sendero",
  });

  const encargado = await (await browser.newContext()).newPage();
  await entrar(encargado, usuario);
  await expect(encargado.getByText("Encargado de turno · Sucursal Sendero")).toBeVisible();

  const filaUsuario = fila(admin, usuario);
  await filaUsuario.getByText(`Editar ${usuario}`).click();
  await filaUsuario.getByRole("button", { name: "Desactivar usuario" }).click();
  await expect(filaUsuario.getByText("Inactivo", { exact: true })).toBeVisible();

  await encargado.goto("/mis-registros");
  await expect(encargado).toHaveURL(/\/login$/);
});
