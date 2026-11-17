import { expect, test } from "vitest";
import { barrasDiaSemana, barrasHora, porcentaje } from "./analisis";

test("barrasDiaSemana ordena de lunes a domingo", () => {
  const b = barrasDiaSemana([{ diaSemana: 0, registros: 1, costoCentavos: 500 }, { diaSemana: 1, registros: 2, costoCentavos: 900 }]);
  expect(b.map((x) => [x.etiqueta, x.valor])).toEqual([["Lun", 900], ["Mar", 0], ["Mié", 0], ["Jue", 0], ["Vie", 0], ["Sáb", 0], ["Dom", 500]]);
});

test("barrasHora rellena los huecos entre la primera y la última hora", () => {
  const b = barrasHora([{ hora: 9, registros: 1, costoCentavos: 100 }, { hora: 12, registros: 1, costoCentavos: 300 }]);
  expect(b.map((x) => [x.etiqueta, x.valor])).toEqual([["9h", 100], ["10h", 0], ["11h", 0], ["12h", 300]]);
  expect(barrasHora([])).toEqual([]);
});

test("porcentaje", () => {
  expect(porcentaje(1, 4)).toBe("25.0%");
  expect(porcentaje(1, 0)).toBe("—");
});
