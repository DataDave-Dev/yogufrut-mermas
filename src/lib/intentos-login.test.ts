import { describe, expect, test } from "vitest";
import { esperaRestanteMs } from "./intentos-login";

const fallo = new Date("2026-11-11T10:00:00Z");
const tras = (ms: number) => new Date(fallo.getTime() + ms);

describe("esperaRestanteMs", () => {
  test("sin espera antes de 5 fallos", () => expect(esperaRestanteMs(4, fallo, fallo)).toBe(0));
  test("1 s tras el 5.º fallo", () => {
    expect(esperaRestanteMs(5, fallo, tras(400))).toBe(600);
    expect(esperaRestanteMs(5, fallo, tras(1000))).toBe(0);
  });
  test("se duplica en cada fallo", () => expect(esperaRestanteMs(8, fallo, fallo)).toBe(8000));
  test("tope de 5 minutos", () => expect(esperaRestanteMs(40, fallo, fallo)).toBe(300_000));
});
