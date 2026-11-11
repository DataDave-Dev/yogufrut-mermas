import { describe, expect, test } from "vitest";
import {
  crearPeriodo,
  desplazar,
  esFechaValida,
  etiquetaPeriodo,
  fechaLocal,
  fechasDelPeriodo,
  inicioDelDia,
  leerPeriodo,
  rangoDeFechas,
  saludo,
  ultimoDia,
  variacion,
} from "./periodos";

const utc = (iso: string) => Date.parse(iso);

describe("inicioDelDia", () => {
  test("medianoche de Monterrey es 06:00 UTC", () => {
    expect(inicioDelDia("2026-11-11")).toBe(utc("2026-11-11T06:00:00Z"));
  });
});

describe("fechaLocal", () => {
  test("las 23:30 locales siguen siendo el mismo día", () => {
    expect(fechaLocal(utc("2026-11-12T05:30:00Z"))).toBe("2026-11-11");
    expect(fechaLocal(utc("2026-11-12T06:00:00Z"))).toBe("2026-11-12");
  });
});

describe("crearPeriodo", () => {
  test("día", () => {
    const p = crearPeriodo("dia", "2026-11-11");
    expect([p.inicio, p.fin]).toEqual(["2026-11-11", "2026-11-12"]);
    expect(p.hasta - p.desde).toBe(86_400_000);
  });
  test("semana de lunes a domingo", () => {
    expect(crearPeriodo("semana", "2026-11-11").inicio).toBe("2026-11-09");
    expect(crearPeriodo("semana", "2026-11-15").inicio).toBe("2026-11-09");
    expect(crearPeriodo("semana", "2026-11-16").inicio).toBe("2026-11-16");
  });
  test("mes", () => {
    const p = crearPeriodo("mes", "2026-11-11");
    expect([p.inicio, p.fin]).toEqual(["2026-11-01", "2026-12-01"]);
    expect(crearPeriodo("mes", "2026-12-31").fin).toBe("2027-01-01");
  });
});

describe("desplazar", () => {
  test("mes anterior", () => expect(desplazar(crearPeriodo("mes", "2026-11-11"), -1).inicio).toBe("2026-10-01"));
  test("semana siguiente", () => expect(desplazar(crearPeriodo("semana", "2026-11-11"), 1).inicio).toBe("2026-11-16"));
  test("día anterior cruza de mes", () => expect(desplazar(crearPeriodo("dia", "2026-11-01"), -1).inicio).toBe("2026-10-31"));
});

describe("etiquetaPeriodo", () => {
  test("formatos", () => {
    expect(etiquetaPeriodo(crearPeriodo("dia", "2026-11-11"))).toBe("11/11/2026");
    expect(etiquetaPeriodo(crearPeriodo("semana", "2026-11-11"))).toBe("09/11/2026 – 15/11/2026");
    expect(etiquetaPeriodo(crearPeriodo("mes", "2026-11-11"))).toBe("noviembre 2026");
  });
});

describe("rangoDeFechas", () => {
  test("hasta es inclusivo", () => {
    expect(rangoDeFechas("2026-11-01", "2026-11-10")).toEqual({
      desde: utc("2026-11-01T06:00:00Z"),
      hasta: utc("2026-11-11T06:00:00Z"),
    });
  });
  test("sin límites", () => expect(rangoDeFechas()).toEqual({ desde: undefined, hasta: undefined }));
});

describe("esFechaValida", () => {
  test("acepta fechas reales", () => expect(esFechaValida("2026-02-28")).toBe(true));
  test("rechaza inexistentes o mal formadas", () => {
    expect(esFechaValida("2026-02-30")).toBe(false);
    expect(esFechaValida("11/11/2026")).toBe(false);
  });
});

describe("leerPeriodo", () => {
  const ahora = Date.parse("2026-11-11T18:00:00Z");
  test("por defecto, el mes actual", () => expect(leerPeriodo(undefined, undefined, ahora).inicio).toBe("2026-11-01"));
  test("valores inválidos caen al mes actual", () => {
    const p = leerPeriodo("anio", "2026-13-01", ahora);
    expect([p.tipo, p.inicio]).toEqual(["mes", "2026-11-01"]);
  });
  test("semana pedida", () => expect(leerPeriodo("semana", "2026-11-11", ahora).inicio).toBe("2026-11-09"));
  test("último día", () => expect(ultimoDia(crearPeriodo("mes", "2026-02-10"))).toBe("2026-02-28"));
});

describe("variacion y saludo", () => {
  test("variación porcentual", () => {
    expect(variacion(150, 100)).toBe(50);
    expect(variacion(50, 100)).toBe(-50);
    expect(variacion(10, 0)).toBeNull();
  });
  test("saludo por hora de Monterrey", () => {
    expect(saludo(Date.parse("2026-11-11T15:00:00Z"))).toBe("Buenos días"); // 09:00
    expect(saludo(Date.parse("2026-11-11T21:00:00Z"))).toBe("Buenas tardes"); // 15:00
    expect(saludo(Date.parse("2026-11-12T03:00:00Z"))).toBe("Buenas noches"); // 21:00
  });
});

describe("fechasDelPeriodo", () => {
  test("semana de 7 días y mes completo", () => {
    expect(fechasDelPeriodo(crearPeriodo("semana", "2026-11-11"))).toEqual([
      "2026-11-09", "2026-11-10", "2026-11-11", "2026-11-12", "2026-11-13", "2026-11-14", "2026-11-15",
    ]);
    expect(fechasDelPeriodo(crearPeriodo("mes", "2026-02-01"))).toHaveLength(28);
  });
});
