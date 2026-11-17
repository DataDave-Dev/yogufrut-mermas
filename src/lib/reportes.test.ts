import { beforeAll, describe, expect, test, vi } from "vitest";
import { crearPeriodo } from "./periodos";

// Base SQLite en memoria con las migraciones reales.
vi.stubEnv("DATABASE_URL", ":memory:");
const { db } = await import("@/db");
const s = await import("@/db/schema");
const { migrate } = await import("drizzle-orm/libsql/migrator");
const { obtenerReporte, obtenerResumenGeneral } = await import("./reportes");

const t = (iso: string) => new Date(iso);
let clave = 0;

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.insert(s.sucursales).values([{ id: 1, nombre: "Sendero" }, { id: 2, nombre: "Cumbres" }, { id: 3, nombre: "Vacía" }]);
  await db.insert(s.usuarios).values([
    { id: 1, usuario: "ana", nombreCompleto: "Ana", rol: "empleado", sucursalId: 1, passwordHash: "x" },
    { id: 2, usuario: "juan", nombreCompleto: "Juan", rol: "encargado", sucursalId: 1, passwordHash: "x" },
    { id: 3, usuario: "luis", nombreCompleto: "Luis", rol: "empleado", sucursalId: 2, passwordHash: "x" },
  ]);
  await db.insert(s.productos).values([
    { id: 1, categoria: "Fruta", nombre: "Fresa", unidad: "kg", costoUnitarioCentavos: 7000 },
    { id: 2, categoria: "Lácteos", nombre: "Leche", unidad: "L", costoUnitarioCentavos: 2800 },
  ]);
  await db.insert(s.motivos).values([{ id: 1, nombre: "Caducidad" }, { id: 2, nombre: "Derrame" }]);

  const merma = (sucursalId: number, usuarioId: number, productoId: number, motivoId: number, mil: number, cent: number, creadaEn: Date, cancelada = false) => ({
    sucursalId, usuarioId, productoId, motivoId,
    cantidadMilesimas: mil,
    unidad: productoId === 1 ? ("kg" as const) : ("L" as const),
    costoUnitarioCentavos: productoId === 1 ? 7000 : 2800,
    costoTotalCentavos: cent,
    creadaEn,
    claveEnvio: `c${++clave}`,
    canceladaEn: cancelada ? creadaEn : null,
  });
  await db.insert(s.mermas).values([
    merma(1, 1, 1, 1, 2000, 14000, t("2026-11-03T15:00:00Z")), // Fresa 2 kg, Caducidad, Ana
    merma(1, 2, 1, 1, 1000, 7000, t("2026-11-10T16:00:00Z")), // Fresa 1 kg, Caducidad, Juan
    merma(1, 1, 2, 2, 4000, 11200, t("2026-11-12T05:30:00Z")), // Leche 4 L, Derrame, Ana — 23:30 local del 11
    merma(1, 1, 2, 2, 9000, 25200, t("2026-11-05T15:00:00Z"), true), // cancelada: no cuenta
    merma(1, 1, 2, 1, 1000, 2800, t("2026-10-31T15:00:00Z")), // octubre: fuera del periodo
    merma(2, 3, 2, 2, 1000, 2800, t("2026-11-04T15:00:00Z")), // otra sucursal
  ]);
});

describe("obtenerReporte", () => {
  const noviembre = crearPeriodo("mes", "2026-11-11");

  test("totales del periodo sin cancelados ni otras sucursales", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.registros).toBe(3);
    expect(r.costoCentavos).toBe(14000 + 7000 + 11200);
  });

  test("productos ordenados por costo con cantidad sumada", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.productos.map((p) => [p.nombre, p.registros, p.cantidadMilesimas, p.costoCentavos])).toEqual([
      ["Fresa", 2, 3000, 21000],
      ["Leche", 1, 4000, 11200],
    ]);
  });

  test("motivos por número de registros", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.motivos.map((m) => [m.nombre, m.registros])).toEqual([["Caducidad", 2], ["Derrame", 1]]);
  });

  test("empleados por costo", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.empleados.map((e) => [e.nombre, e.registros, e.costoCentavos])).toEqual([["Ana", 2, 25200], ["Juan", 1, 7000]]);
  });

  test("desglose por día en hora de Monterrey", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.dias.map((d) => [d.fecha, d.registros])).toEqual([["2026-11-03", 1], ["2026-11-10", 1], ["2026-11-11", 1]]);
  });

  test("categorías por costo", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.categorias.map((c) => [c.nombre, c.registros, c.costoCentavos])).toEqual([["Fruta", 2, 21000], ["Lácteos", 1, 11200]]);
  });

  test("día de la semana y hora en hora de Monterrey", async () => {
    const r = await obtenerReporte(1, noviembre);
    // 3 y 10 de noviembre de 2026 son martes (2); las 05:30 UTC del 12 son las 23:30 del miércoles 11 (3).
    expect(r.diasSemana.map((d) => [d.diaSemana, d.registros]).sort()).toEqual([[2, 2], [3, 1]]);
    expect(r.horas.map((h) => [h.hora, h.registros])).toEqual([[9, 1], [10, 1], [23, 1]]);
  });

  test("cancelados se cuentan aparte", async () => {
    const r = await obtenerReporte(1, noviembre);
    expect(r.cancelados).toEqual({ registros: 1, costoCentavos: 25200 });
  });

  test("sin sucursal abarca todas", async () => {
    const r = await obtenerReporte(undefined, noviembre);
    expect([r.registros, r.costoCentavos]).toEqual([4, 35000]);
  });

  test("periodo sin registros", async () => {
    const r = await obtenerReporte(1, crearPeriodo("dia", "2026-11-20"));
    expect(r).toMatchObject({ registros: 0, costoCentavos: 0, productos: [], dias: [] });
  });
});

describe("obtenerResumenGeneral", () => {
  test("todas las sucursales, incluso sin mermas, ordenadas por costo", async () => {
    const r = await obtenerResumenGeneral(crearPeriodo("mes", "2026-11-01"));
    expect(r.sucursales.map((x) => [x.nombre, x.registros, x.costoCentavos])).toEqual([
      ["Sendero", 3, 32200],
      ["Cumbres", 1, 2800],
      ["Vacía", 0, 0],
    ]);
    expect([r.registros, r.costoCentavos]).toEqual([4, 35000]);
  });
});
