import { describe, expect, test } from "vitest";
import { sesionVigente } from "./reglas-sesion";

const inicio = new Date("2026-11-11T08:00:00Z");
const mas = (min: number) => new Date(inicio.getTime() + min * 60_000);

describe("sesionVigente", () => {
  test("vigente con actividad reciente", () => {
    expect(sesionVigente(inicio, mas(10), mas(20))).toBe(true);
  });
  test("expira tras 30 minutos sin actividad", () => {
    expect(sesionVigente(inicio, mas(10), mas(40))).toBe(false);
  });
  test("expira a las 8 horas aunque haya actividad", () => {
    expect(sesionVigente(inicio, mas(479), mas(480))).toBe(false);
    expect(sesionVigente(inicio, mas(470), mas(479))).toBe(true);
  });
});
