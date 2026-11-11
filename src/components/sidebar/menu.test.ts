import { describe, expect, test } from "vitest";
import { estaActivo, menuPara } from "./menu";

const textos = (rol: Parameters<typeof menuPara>[0]) => menuPara(rol).flatMap((g) => g.elementos.map((e) => e.texto));

describe("menuPara", () => {
  test("empleado: solo General", () => {
    expect(menuPara("empleado").map((g) => g.titulo)).toEqual(["General"]);
    expect(textos("empleado")).toEqual(["Inicio", "Registrar merma", "Mis registros"]);
  });
  test("gerente: análisis y usuarios", () => {
    expect(textos("gerente")).toEqual(["Inicio", "Registrar merma", "Mis registros", "Historial", "Reportes", "Usuarios"]);
  });
  test("admin: sin registrar y con catálogos", () => {
    expect(textos("admin")).toEqual(["Inicio", "Historial", "Reportes", "Usuarios", "Sucursales", "Productos", "Motivos"]);
  });
});

describe("estaActivo", () => {
  test("inicio solo exacto", () => {
    expect(estaActivo("/", "/")).toBe(true);
    expect(estaActivo("/", "/reportes")).toBe(false);
  });
  test("subrutas", () => {
    expect(estaActivo("/reportes", "/reportes/general")).toBe(true);
    expect(estaActivo("/sucursal", "/sucursales")).toBe(false);
  });
});
