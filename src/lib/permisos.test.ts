import { describe, expect, test } from "vitest";
import { puedeCancelarMerma, puedeVerMerma } from "./permisos";

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
  test("gerente de la sucursal", () => expect(puedeVerMerma(usuario("gerente", 1), merma)).toBe(true));
  test("gerente de otra sucursal no", () => expect(puedeVerMerma(usuario("gerente", 2), merma)).toBe(false));
});
