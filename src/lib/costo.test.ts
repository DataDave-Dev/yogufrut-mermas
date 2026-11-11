import { describe, expect, test } from "vitest";
import { costoTotalCentavos, decimalAEntero, enteroADecimal } from "./costo";

const total = (costo: string, cantidad: string) =>
  enteroADecimal(costoTotalCentavos(decimalAEntero(costo, 2), decimalAEntero(cantidad, 3)), 2);

describe("costoTotalCentavos", () => {
  test("cantidad entera", () => expect(total("52.00", "3")).toBe("156.00"));
  test("cantidad con decimales sin error de flotante", () => {
    expect(total("0.10", "3")).toBe("0.30");
    expect(total("45.00", "0.125")).toBe("5.63");
  });
  test("montos pequeños", () => {
    expect(total("0.30", "0.5")).toBe("0.15");
    expect(total("0.01", "0.001")).toBe("0.00");
  });
});

describe("decimalAEntero", () => {
  test("escala", () => {
    expect(decimalAEntero("3.5", 3)).toBe(3500);
    expect(decimalAEntero("10", 2)).toBe(1000);
  });
  test("rechaza valores inválidos", () => {
    expect(() => decimalAEntero("abc", 2)).toThrow();
    expect(() => decimalAEntero("1.2345", 3)).toThrow();
    expect(() => decimalAEntero("99999999999999999999", 2)).toThrow();
  });
});

describe("enteroADecimal", () => {
  test("rellena ceros", () => {
    expect(enteroADecimal(5, 2)).toBe("0.05");
    expect(enteroADecimal(1050, 2)).toBe("10.50");
  });
});
