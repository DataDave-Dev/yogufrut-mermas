import { CifrasResumen, HojaImpresion, TablaResumen } from "@/components/HojaImpresion";
import { porcentaje } from "@/lib/analisis";
import { requireUsuario } from "@/lib/auth";
import { formatoPesos } from "@/lib/formato";
import { desplazar, etiquetaPeriodo, leerPeriodo, variacion } from "@/lib/periodos";
import { obtenerReporte, obtenerResumenGeneral } from "@/lib/reportes";
import { rutaResumenGeneral } from "@/lib/rutas-reportes";

export const metadata = { title: "Resumen general para imprimir" };

const LIMITE_RANKING = 15;
const cambio = (v: number | null) => (v === null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(1)}%`);

export default async function ResumenGeneralImprimible({ searchParams }: PageProps<"/reportes/general/imprimir">) {
  const usuario = await requireUsuario(["admin"]);
  const parametros = await searchParams;
  const periodo = leerPeriodo(parametros.tipo, parametros.fecha);
  const [r, anterior, global] = await Promise.all([
    obtenerResumenGeneral(periodo),
    obtenerResumenGeneral(desplazar(periodo, -1)),
    obtenerReporte(undefined, periodo, LIMITE_RANKING),
  ]);
  const costoAnterior = new Map(anterior.sucursales.map((s) => [s.id, s.costoCentavos]));

  return (
    <HojaImpresion
      titulo="Resumen general"
      subtitulo={`Todas las sucursales · ${etiquetaPeriodo(periodo)}`}
      autor={usuario.nombreCompleto}
      volver={rutaResumenGeneral(periodo.tipo, periodo.inicio)}
      automatico={parametros.imprimir === "1"}
    >
      <CifrasResumen
        cifras={[
          { etiqueta: "Costo total", valor: formatoPesos(r.costoCentavos), destacada: true },
          { etiqueta: "Registros", valor: String(r.registros) },
          { etiqueta: "vs. periodo anterior", valor: cambio(variacion(r.costoCentavos, anterior.costoCentavos)) },
          { etiqueta: "Cancelados", valor: String(global.cancelados.registros) },
        ]}
      />

      <div className="mt-6">
        <TablaResumen
          titulo="Sucursales"
          columnas={["Sucursal", "Registros", "Costo", "% del total", "vs. anterior"]}
          filas={r.sucursales.map((s) => [
            s.activa ? s.nombre : `${s.nombre} (desactivada)`,
            String(s.registros),
            formatoPesos(s.costoCentavos),
            porcentaje(s.costoCentavos, r.costoCentavos),
            cambio(variacion(s.costoCentavos, costoAnterior.get(s.id) ?? 0)),
          ])}
        />
      </div>

      {global.registros > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-6">
          <TablaResumen
            titulo="Productos con más merma"
            columnas={["Producto", "Registros", "Costo"]}
            filas={global.productos.map((p) => [`${p.nombre} (${p.unidad})`, String(p.registros), formatoPesos(p.costoCentavos)])}
          />
          <div className="flex flex-col gap-6">
            <TablaResumen
              titulo="Por categoría"
              columnas={["Categoría", "Registros", "Costo", "%"]}
              filas={global.categorias.map((c) => [c.nombre, String(c.registros), formatoPesos(c.costoCentavos), porcentaje(c.costoCentavos, global.costoCentavos)])}
            />
            <TablaResumen
              titulo="Motivos"
              columnas={["Motivo", "Registros", "Costo"]}
              filas={global.motivos.map((m) => [m.nombre, String(m.registros), formatoPesos(m.costoCentavos)])}
            />
          </div>
        </div>
      )}
    </HojaImpresion>
  );
}
