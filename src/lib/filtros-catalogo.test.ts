import { describe, expect, test } from "vitest";
import { aQueryCatalogo, leerFiltrosCatalogo, rangoPagina } from "./filtros-catalogo";

describe("leerFiltrosCatalogo", () => {
  test("valores por defecto", () => {
    expect(leerFiltrosCatalogo({})).toEqual({ estado: "todos", pagina: 1 });
  });
  test("convierte y valida", () => {
    const f = leerFiltrosCatalogo({ q: "  ana ", estado: "inactivos", rol: "gerente", sucursal: "3", categoria: "Bases", pagina: "2" });
    expect(f).toEqual({ q: "ana", estado: "inactivos", rol: "gerente", sucursal: 3, categoria: "Bases", pagina: 2 });
  });
  test("ignora valores inválidos o vacíos", () => {
    const f = leerFiltrosCatalogo({ q: "   ", estado: "x", rol: "jefe", sucursal: "abc", pagina: "0", categoria: "" });
    expect(f).toEqual({ estado: "todos", pagina: 1 });
  });
});

describe("aQueryCatalogo", () => {
  test("omite vacíos y valores por defecto", () => {
    expect(aQueryCatalogo({ estado: "todos", pagina: 1 })).toBe("");
    expect(aQueryCatalogo({ q: "ana lópez", estado: "activos", pagina: 3 })).toBe("?q=ana+l%C3%B3pez&estado=activos&pagina=3");
  });
});

test("rangoPagina calcula el desplazamiento", () => {
  expect(rangoPagina(1).desplazamiento).toBe(0);
  expect(rangoPagina(3).desplazamiento).toBe(2 * rangoPagina(3).limite);
});
