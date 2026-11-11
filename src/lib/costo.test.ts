import { describe, expect, test } from "vitest";
import { calcularCostoTotal } from "./costo";

describe("calcularCostoTotal", () => {
  test("cantidad entera", () => {
    expect(calcularCostoTotal("52.00", "3")).toBe("156.00");
  });
  test("cantidad con decimales sin error de flotante", () => {
    expect(calcularCostoTotal("0.10", "3")).toBe("0.30");
    expect(calcularCostoTotal("45.00", "0.125")).toBe("5.63");
  });
  test("montos pequeños", () => {
    expect(calcularCostoTotal("0.30", "0.5")).toBe("0.15");
    expect(calcularCostoTotal("0.01", "0.001")).toBe("0.00");
  });
  test("rechaza valores inválidos", () => {
    expect(() => calcularCostoTotal("abc", "1")).toThrow();
    expect(() => calcularCostoTotal("1.00", "1.2345")).toThrow();
  });
});
