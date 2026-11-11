import { describe, expect, test } from "vitest";
import {
  puedeCancelarMerma,
  puedeExportar,
  puedeGestionarUsuario,
  puedeVerMerma,
  puedeVerReportes,
  rolesAsignables,
} from "./permisos";

const merma = { usuarioId: 10, sucursalId: 1 };
const usuario = (rol: "empleado" | "encargado" | "gerente" | "admin", sucursalId: number | null, id = 99) => ({
  id,
  rol,
  sucursalId,
});

describe("puedeCancelarMerma", () => {
  test("gerente de la misma sucursal", () => expect(puedeCancelarMerma(usuario("gerente", 1), merma)).toBe(true));
  test("gerente de otra sucursal", () => expect(puedeCancelarMerma(usuario("gerente", 2), merma)).toBe(false));
  test("administrador", () => expect(puedeCancelarMerma(usuario("admin", null), merma)).toBe(true));
  test("empleado autor no puede", () => expect(puedeCancelarMerma(usuario("empleado", 1, 10), merma)).toBe(false));
  test("encargado no puede", () => expect(puedeCancelarMerma(usuario("encargado", 1), merma)).toBe(false));
});

describe("puedeVerMerma", () => {
  test("autor", () => expect(puedeVerMerma(usuario("empleado", 1, 10), merma)).toBe(true));
  test("otro empleado de la sucursal no", () => expect(puedeVerMerma(usuario("empleado", 1), merma)).toBe(false));
  test("encargado de la sucursal sí, de otra no", () => {
    expect(puedeVerMerma(usuario("encargado", 1), merma)).toBe(true);
    expect(puedeVerMerma(usuario("encargado", 2), merma)).toBe(false);
  });
  test("gerente de la sucursal", () => expect(puedeVerMerma(usuario("gerente", 1), merma)).toBe(true));
  test("gerente de otra sucursal no", () => expect(puedeVerMerma(usuario("gerente", 2), merma)).toBe(false));
});

describe("gestión de usuarios", () => {
  const gerente = usuario("gerente", 1);
  test("gerente asigna solo empleado y encargado", () => {
    expect(rolesAsignables(gerente)).toEqual(["empleado", "encargado"]);
  });
  test("admin asigna todos los roles", () => expect(rolesAsignables(usuario("admin", null))).toHaveLength(4));
  test("empleado y encargado no gestionan usuarios", () => {
    expect(rolesAsignables(usuario("empleado", 1))).toEqual([]);
    expect(puedeGestionarUsuario(usuario("encargado", 1), { rol: "empleado", sucursalId: 1 })).toBe(false);
  });
  test("gerente gestiona empleados de su sucursal", () => {
    expect(puedeGestionarUsuario(gerente, { rol: "empleado", sucursalId: 1 })).toBe(true);
    expect(puedeGestionarUsuario(gerente, { rol: "encargado", sucursalId: 1 })).toBe(true);
  });
  test("gerente no gestiona otra sucursal, otros gerentes ni admin", () => {
    expect(puedeGestionarUsuario(gerente, { rol: "empleado", sucursalId: 2 })).toBe(false);
    expect(puedeGestionarUsuario(gerente, { rol: "gerente", sucursalId: 1 })).toBe(false);
    expect(puedeGestionarUsuario(gerente, { rol: "admin", sucursalId: null })).toBe(false);
  });
  test("admin gestiona a cualquiera", () => {
    expect(puedeGestionarUsuario(usuario("admin", null), { rol: "gerente", sucursalId: 3 })).toBe(true);
  });
});

describe("reportes", () => {
  test("historial y panel: encargado, gerente y admin", () => {
    expect(["empleado", "encargado", "gerente", "admin"].map((r) => puedeVerReportes(r as never))).toEqual([
      false,
      true,
      true,
      true,
    ]);
  });
  test("exportar: gerente y admin", () => {
    expect(puedeExportar("encargado")).toBe(false);
    expect(puedeExportar("gerente")).toBe(true);
    expect(puedeExportar("admin")).toBe(true);
  });
});
