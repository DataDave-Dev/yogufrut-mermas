import type { NextRequest } from "next/server";
import { sucursalDelReporte } from "@/lib/acceso-reportes";
import { obtenerUsuario } from "@/lib/auth";
import { crearLibroExcel, nombreArchivo } from "@/lib/exportacion";
import { leerPeriodo } from "@/lib/periodos";
import { puedeExportar } from "@/lib/permisos";
import { obtenerExportacion } from "@/lib/reportes";

/** Descarga del reporte del periodo en Excel: gerente (su sucursal) y administrador. */
export async function GET(req: NextRequest) {
  const usuario = await obtenerUsuario();
  if (!usuario) return new Response("No autenticado", { status: 401 });
  if (!puedeExportar(usuario.rol)) return new Response("Acceso denegado", { status: 403 });

  const p = req.nextUrl.searchParams;
  const sucursal = await sucursalDelReporte(usuario, p.get("sucursal"));
  if (!sucursal) return new Response("Sucursal no encontrada", { status: 404 });

  const periodo = leerPeriodo(p.get("tipo"), p.get("fecha"));
  const datos = await obtenerExportacion(sucursal.id, periodo);
  const archivo = await crearLibroExcel(sucursal.nombre, periodo, datos);
  const nombre = nombreArchivo(sucursal.nombre, periodo, "xlsx");

  return new Response(archivo, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
