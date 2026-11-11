import ExcelJS from "exceljs";
import { formatoFecha, formatoHora, PUESTOS } from "./formato";
import { etiquetaPeriodo, type Periodo } from "./periodos";
import type { Rol } from "./auth-tipos";

/** "Sucursal Sendero" → "sucursal-sendero" (para nombres de archivo). */
export function slug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** mermas-sucursal-sendero-2026-11.xlsx / …-2026-11-11 / …-semana-2026-11-09 */
export function nombreArchivo(sucursal: string, periodo: Periodo, extension: string): string {
  const parte = periodo.tipo === "mes" ? periodo.inicio.slice(0, 7) : periodo.tipo === "semana" ? `semana-${periodo.inicio}` : periodo.inicio;
  return `mermas-${slug(sucursal)}-${parte}.${extension}`;
}

/** Datos mínimos que necesita el archivo (coinciden con obtenerExportacion). */
export type DatosExportacion = {
  registros: {
    creadaEn: Date;
    usuario: string;
    rolUsuario: Rol;
    producto: string;
    cantidadMilesimas: number;
    unidad: string;
    motivo: string;
    costoUnitarioCentavos: number;
    costoTotalCentavos: number;
    observaciones: string | null;
  }[];
  truncado: boolean;
  registrosTotales: number;
  costoCentavos: number;
  productos: { nombre: string; unidad: string; registros: number; cantidadMilesimas: number; costoCentavos: number }[];
  motivos: { nombre: string; registros: number; costoCentavos: number }[];
  empleados: { nombre: string; rol: Rol; registros: number; costoCentavos: number }[];
};

const MONEDA = '"$"#,##0.00';
const CANTIDAD = "#,##0.###";
const pesos = (centavos: number) => centavos / 100;
const ENCABEZADO: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: "FFFFFFFF" } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF7D2544" } },
  alignment: { vertical: "middle" },
};

/** Libro .xlsx con hojas "Resumen" y "Registros". */
export async function crearLibroExcel(sucursal: string, periodo: Periodo, datos: DatosExportacion, generado = new Date()) {
  const libro = new ExcelJS.Workbook();
  libro.creator = "Yogufrut · Control de mermas";
  libro.created = generado;

  const resumen = libro.addWorksheet("Resumen");
  resumen.columns = [{ width: 34 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 16 }];
  resumen.addRow(["Reporte de mermas"]).font = { bold: true, size: 16, color: { argb: "FF7D2544" } };
  resumen.addRow(["Sucursal", sucursal]);
  resumen.addRow(["Periodo", etiquetaPeriodo(periodo)]);
  resumen.addRow(["Generado", `${formatoFecha(generado)} ${formatoHora(generado)}`]);
  resumen.addRow(["Total de registros", datos.registrosTotales]);
  const total = resumen.addRow(["Costo total", pesos(datos.costoCentavos)]);
  total.getCell(2).numFmt = MONEDA;
  total.font = { bold: true };
  for (let i = 2; i <= 6; i++) resumen.getCell(`A${i}`).font = { color: { argb: "FF655B4F" } };

  const tabla = (titulo: string, encabezados: string[], filas: (string | number)[][], formatos: (string | undefined)[]) => {
    resumen.addRow([]);
    resumen.addRow([titulo]).font = { bold: true, size: 12 };
    const cabecera = resumen.addRow(encabezados);
    cabecera.eachCell((c) => Object.assign(c, { style: { ...c.style, ...ENCABEZADO } }));
    for (const fila of filas) {
      const r = resumen.addRow(fila);
      formatos.forEach((f, i) => f && (r.getCell(i + 1).numFmt = f));
    }
  };
  tabla(
    "Productos con más merma",
    ["Producto", "Unidad", "Registros", "Cantidad", "Costo"],
    datos.productos.map((p) => [p.nombre, p.unidad, p.registros, p.cantidadMilesimas / 1000, pesos(p.costoCentavos)]),
    [undefined, undefined, undefined, CANTIDAD, MONEDA],
  );
  tabla(
    "Motivos",
    ["Motivo", "", "Registros", "", "Costo"],
    datos.motivos.map((m) => [m.nombre, "", m.registros, "", pesos(m.costoCentavos)]),
    [undefined, undefined, undefined, undefined, MONEDA],
  );
  tabla(
    "Mermas por empleado",
    ["Empleado", "Puesto", "Registros", "", "Costo"],
    datos.empleados.map((e) => [e.nombre, PUESTOS[e.rol], e.registros, "", pesos(e.costoCentavos)]),
    [undefined, undefined, undefined, undefined, MONEDA],
  );
  if (datos.truncado) {
    resumen.addRow([]);
    resumen.addRow([`La hoja "Registros" muestra solo los ${datos.registros.length} más recientes.`]).font = { italic: true };
  }

  const hoja = libro.addWorksheet("Registros", { views: [{ state: "frozen", ySplit: 1 }] });
  hoja.columns = [
    { header: "Fecha", width: 12 },
    { header: "Hora", width: 11 },
    { header: "Usuario", width: 24 },
    { header: "Puesto", width: 20 },
    { header: "Producto", width: 30 },
    { header: "Cantidad", width: 11, style: { numFmt: CANTIDAD } },
    { header: "Unidad", width: 8 },
    { header: "Motivo", width: 26 },
    { header: "Costo unitario", width: 15, style: { numFmt: MONEDA } },
    { header: "Costo total", width: 14, style: { numFmt: MONEDA } },
    { header: "Observaciones", width: 44 },
  ];
  hoja.getRow(1).eachCell((c) => Object.assign(c, { style: { ...c.style, ...ENCABEZADO } }));
  for (const r of datos.registros) {
    hoja.addRow([
      formatoFecha(r.creadaEn),
      formatoHora(r.creadaEn),
      r.usuario,
      PUESTOS[r.rolUsuario],
      r.producto,
      r.cantidadMilesimas / 1000,
      r.unidad,
      r.motivo,
      pesos(r.costoUnitarioCentavos),
      pesos(r.costoTotalCentavos),
      r.observaciones ?? "",
    ]);
  }
  hoja.autoFilter = { from: "A1", to: "K1" };

  return new Uint8Array(await libro.xlsx.writeBuffer());
}
