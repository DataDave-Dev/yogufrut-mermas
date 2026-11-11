import ExcelJS from "exceljs";
import { describe, expect, test } from "vitest";
import { crearLibroExcel, nombreArchivo, slug, type DatosExportacion } from "./exportacion";
import { crearPeriodo } from "./periodos";

describe("nombres de archivo", () => {
  test("slug sin acentos", () => expect(slug("Sucursal Peñón Álamo")).toBe("sucursal-penon-alamo"));
  test("por tipo de periodo", () => {
    expect(nombreArchivo("Sucursal Sendero", crearPeriodo("mes", "2026-11-11"), "xlsx")).toBe("mermas-sucursal-sendero-2026-11.xlsx");
    expect(nombreArchivo("Sendero", crearPeriodo("dia", "2026-11-11"), "xlsx")).toBe("mermas-sendero-2026-11-11.xlsx");
    expect(nombreArchivo("Sendero", crearPeriodo("semana", "2026-11-11"), "xlsx")).toBe("mermas-sendero-semana-2026-11-09.xlsx");
  });
});

describe("crearLibroExcel", () => {
  const datos: DatosExportacion = {
    registros: [
      {
        creadaEn: new Date("2026-11-11T17:30:00Z"),
        usuario: "Ana López",
        rolUsuario: "empleado",
        producto: "Fresa",
        cantidadMilesimas: 2500,
        unidad: "kg",
        motivo: "Caducidad",
        costoUnitarioCentavos: 7000,
        costoTotalCentavos: 17500,
        observaciones: "Vencida",
      },
    ],
    truncado: false,
    registrosTotales: 1,
    costoCentavos: 17500,
    productos: [{ nombre: "Fresa", unidad: "kg", registros: 1, cantidadMilesimas: 2500, costoCentavos: 17500 }],
    motivos: [{ nombre: "Caducidad", registros: 1, costoCentavos: 17500 }],
    empleados: [{ nombre: "Ana López", rol: "empleado", registros: 1, costoCentavos: 17500 }],
  };

  test("hojas Resumen y Registros con montos numéricos", async () => {
    const buffer = await crearLibroExcel("Sucursal Sendero", crearPeriodo("mes", "2026-11-11"), datos, new Date("2026-11-11T18:00:00Z"));
    const libro = new ExcelJS.Workbook();
    await libro.xlsx.load(buffer.buffer as ArrayBuffer);
    expect(libro.worksheets.map((h) => h.name)).toEqual(["Resumen", "Registros"]);

    const resumen = libro.getWorksheet("Resumen")!;
    expect(resumen.getCell("B2").value).toBe("Sucursal Sendero");
    expect(resumen.getCell("B3").value).toBe("noviembre 2026");
    expect(resumen.getCell("B6").value).toBe(175);

    const registros = libro.getWorksheet("Registros")!;
    expect(registros.getRow(1).getCell(1).value).toBe("Fecha");
    const fila = registros.getRow(2);
    expect([fila.getCell(1).value, fila.getCell(3).value, fila.getCell(6).value, fila.getCell(10).value]).toEqual([
      "11/11/2026",
      "Ana López",
      2.5,
      175,
    ]);
  });
});
