import { describe, expect, test } from "vitest";
import { aQuery, leerFiltros } from "./filtros-historial";

describe("leerFiltros", () => {
  test("valores por defecto", () => {
    expect(leerFiltros({})).toEqual({ estado: "activos", pagina: 1 });
  });
  test("convierte y valida", () => {
    const f = leerFiltros({ desde: "2026-11-01", hasta: "2026-11-10", motivo: "3", estado: "todos", pagina: "2" });
    expect(f).toMatchObject({ desde: "2026-11-01", hasta: "2026-11-10", motivo: 3, estado: "todos", pagina: 2 });
  });
  test("ignora valores inválidos", () => {
    const f = leerFiltros({ desde: "2026-02-30", producto: "abc", estado: "x", pagina: "-1", usuario: "" });
    expect(f).toEqual({ estado: "activos", pagina: 1 });
  });
  test("fechas invertidas: no aplica el rango y avisa", () => {
    const f = leerFiltros({ desde: "2026-11-10", hasta: "2026-11-01" });
    expect(f.desde).toBeUndefined();
    expect(f.avisoFechas).toBeTruthy();
  });
});

describe("aQuery", () => {
  test("omite vacíos y valores por defecto", () => {
    expect(aQuery({ estado: "activos", pagina: 1 })).toBe("");
    expect(aQuery({ motivo: 3, pagina: 2, estado: "todos" })).toBe("?motivo=3&estado=todos&pagina=2");
  });
});
