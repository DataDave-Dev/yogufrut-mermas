import Link from "next/link";
import { Barras } from "@/components/Barras";
import { GraficaDias } from "@/components/GraficaDias";
import { ListaMermas } from "@/components/ListaMermas";
import { Ranking } from "@/components/Ranking";
import { estiloBoton } from "@/components/ui/boton";
import { EncabezadoPagina } from "@/components/ui/EncabezadoPagina";
import { Icono } from "@/components/ui/Icono";
import { Indicador } from "@/components/ui/Indicador";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { requireUsuario, type UsuarioSesion } from "@/lib/auth";
import { condicionHistorial, listarMermas, totalesMermas } from "@/lib/consultas-mermas";
import { barrasDiaSemana, porcentaje } from "@/lib/analisis";
import { formatoPesos } from "@/lib/formato";
import { crearPeriodo, desplazar, etiquetaPeriodo, fechaLarga, fechasDelPeriodo, hoyLocal, saludo, variacion } from "@/lib/periodos";
import { obtenerReporte, obtenerResumenGeneral } from "@/lib/reportes";
import { rutaReporte } from "@/lib/rutas-reportes";

export const metadata = { title: "Inicio" };

const veces = (n: number) => `${n} ${n === 1 ? "registro" : "registros"}`;
const RECIENTES = 5;

export default async function Inicio() {
  const usuario = await requireUsuario();
  const nombre = usuario.nombreCompleto.split(" ")[0];
  const hoy = hoyLocal();
  const mes = crearPeriodo("mes", hoy);
  const fecha = fechaLarga();

  return (
    <>
      <EncabezadoPagina
        antetitulo={<span className="inline-block first-letter:uppercase">{fecha}</span>}
        titulo={`${saludo()}, ${nombre}`}
        descripcion={
          usuario.rol === "admin"
            ? "Así van las mermas de todas las sucursales este mes."
            : usuario.rol === "empleado"
              ? "Registra cada merma en cuanto ocurra; toma menos de un minuto."
              : `Así van las mermas de ${usuario.sucursalNombre} este mes.`
        }
        acciones={
          usuario.rol !== "admin" && (
            <Link href="/registrar" className={estiloBoton({ tamano: "lg" })}>
              <Icono nombre="registrar" />
              Registrar merma
            </Link>
          )
        }
      />
      {usuario.rol === "admin" ? (
        <InicioAdmin mesActual={mes} />
      ) : usuario.rol === "empleado" ? (
        <InicioEmpleado usuario={usuario} hoy={hoy} mesActual={mes} />
      ) : (
        <InicioSucursal usuario={usuario} hoy={hoy} mesActual={mes} />
      )}
    </>
  );
}

type Periodo = ReturnType<typeof crearPeriodo>;

async function InicioEmpleado({ usuario, hoy, mesActual }: { usuario: UsuarioSesion; hoy: string; mesActual: Periodo }) {
  const dia = crearPeriodo("dia", hoy);
  const propias = (p: Periodo) =>
    condicionHistorial({ sucursalId: usuario.sucursalId!, usuarioId: usuario.id, desde: p.desde, hasta: p.hasta, estado: "activos" });
  const [deHoy, delMes, recientes] = await Promise.all([
    totalesMermas(propias(dia)),
    totalesMermas(propias(mesActual)),
    listarMermas(condicionHistorial({ sucursalId: usuario.sucursalId!, usuarioId: usuario.id, estado: "todos" }), 1),
  ]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Indicador etiqueta="Tus registros de hoy" valor={String(deHoy.registros)} detalle={formatoPesos(deHoy.costoCentavos)} icono="registrar" destacado />
        <Indicador etiqueta={`Tus registros de ${etiquetaPeriodo(mesActual)}`} valor={String(delMes.registros)} detalle={formatoPesos(delMes.costoCentavos)} icono="lista" />
      </div>
      <Tarjeta
        titulo="Tus últimos registros"
        accion={<Link href="/mis-registros" className={estiloBoton({ variante: "fantasma", tamano: "sm" })}>Ver todos</Link>}
      >
        <ListaMermas mermas={recientes.filas.slice(0, RECIENTES)} vacio="Aún no has registrado mermas." compacta />
      </Tarjeta>
    </>
  );
}

async function InicioSucursal({ usuario, hoy, mesActual }: { usuario: UsuarioSesion; hoy: string; mesActual: Periodo }) {
  const sucursalId = usuario.sucursalId!;
  const dia = crearPeriodo("dia", hoy);
  const [mes, mesAnterior, deHoy, recientes] = await Promise.all([
    obtenerReporte(sucursalId, mesActual),
    totalesMermas(condicionHistorial({ sucursalId, ...rango(desplazar(mesActual, -1)), estado: "activos" })),
    totalesMermas(condicionHistorial({ sucursalId, ...rango(dia), estado: "activos" })),
    listarMermas(condicionHistorial({ sucursalId, estado: "todos" }), 1),
  ]);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta={`Costo de mermas · ${etiquetaPeriodo(mesActual)}`}
          valor={formatoPesos(mes.costoCentavos)}
          variacion={variacion(mes.costoCentavos, mesAnterior.costoCentavos)}
          detalle="vs. mes anterior"
          destacado
        />
        <Indicador etiqueta="Registros del mes" valor={String(mes.registros)} icono="lista" detalle={`${mesAnterior.registros} el mes anterior`} />
        <Indicador etiqueta="Hoy" valor={String(deHoy.registros)} icono="historial" detalle={formatoPesos(deHoy.costoCentavos)} />
        <Indicador
          etiqueta="Producto con más merma"
          valor={mes.productos[0]?.nombre ?? "—"}
          detalle={mes.productos[0] ? formatoPesos(mes.productos[0].costoCentavos) : "Sin registros este mes"}
          icono="producto"
          compacto
        />
      </div>

      {mes.registros > 0 && (
        <GraficaDias
          fechas={fechasDelPeriodo(mesActual)}
          dias={mes.dias}
          href={(fecha) => `/sucursal?${new URLSearchParams({ desde: fecha, hasta: fecha })}`}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Ranking
            titulo="Productos con más merma"
            descripcion="Este mes, por costo"
            vacio="Sin registros este mes."
            filas={mes.productos.slice(0, 4).map((p) => ({
              clave: `${p.id}-${p.unidad}`,
              nombre: p.nombre,
              valor: p.costoCentavos,
              textoValor: formatoPesos(p.costoCentavos),
              detalle: veces(p.registros),
            }))}
            accion={<Link href={rutaReporte("mes", mesActual.inicio)} className={estiloBoton({ variante: "fantasma", tamano: "sm" })}>Reporte</Link>}
          />
          <Ranking
            titulo="Motivos frecuentes"
            vacio="Sin registros este mes."
            filas={mes.motivos.slice(0, 3).map((m) => ({
              clave: m.id,
              nombre: m.nombre,
              valor: m.registros,
              textoValor: veces(m.registros),
              detalle: formatoPesos(m.costoCentavos),
            }))}
          />
        </div>
        <Tarjeta
          titulo="Últimos registros de la sucursal"
          className="lg:col-span-3"
          accion={<Link href="/sucursal" className={estiloBoton({ variante: "fantasma", tamano: "sm" })}>Historial</Link>}
        >
          <ListaMermas mermas={recientes.filas.slice(0, RECIENTES + 2)} mostrarUsuario vacio="La sucursal aún no tiene registros." compacta />
        </Tarjeta>
      </div>

      {mes.registros > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Ranking
            titulo="Costo por categoría"
            descripcion="Este mes"
            vacio="Sin registros este mes."
            filas={mes.categorias.slice(0, 5).map((c) => ({
              clave: c.nombre,
              nombre: c.nombre,
              valor: c.costoCentavos,
              textoValor: formatoPesos(c.costoCentavos),
              detalle: `${porcentaje(c.costoCentavos, mes.costoCentavos)} del costo`,
            }))}
          />
          <Ranking
            titulo="Quién registra"
            descripcion="Este mes, por costo"
            vacio="Sin registros este mes."
            filas={mes.empleados.slice(0, 5).map((e) => ({
              clave: e.id,
              nombre: e.nombre,
              valor: e.costoCentavos,
              textoValor: formatoPesos(e.costoCentavos),
              detalle: veces(e.registros),
            }))}
          />
          <Barras titulo="Costo por día de la semana" descripcion="Este mes" barras={barrasDiaSemana(mes.diasSemana)} className="md:col-span-2 xl:col-span-1" />
        </div>
      )}
    </>
  );
}

async function InicioAdmin({ mesActual }: { mesActual: Periodo }) {
  const [resumen, anterior, global, recientes] = await Promise.all([
    obtenerResumenGeneral(mesActual),
    obtenerResumenGeneral(desplazar(mesActual, -1)),
    obtenerReporte(undefined, mesActual, 5),
    listarMermas(condicionHistorial({ estado: "todos" }), 1),
  ]);
  const conMermas = resumen.sucursales.filter((s) => s.registros > 0);

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Indicador
          etiqueta={`Costo de mermas · ${etiquetaPeriodo(mesActual)}`}
          valor={formatoPesos(resumen.costoCentavos)}
          variacion={variacion(resumen.costoCentavos, anterior.costoCentavos)}
          detalle="vs. mes anterior"
          destacado
        />
        <Indicador etiqueta="Registros del mes" valor={String(resumen.registros)} icono="lista" detalle={`${anterior.registros} el mes anterior`} />
        <Indicador
          etiqueta="Sucursales con mermas"
          valor={`${conMermas.length} de ${resumen.sucursales.length}`}
          icono="sucursal"
        />
        <Indicador
          etiqueta="Sucursal con más merma"
          valor={conMermas[0]?.nombre ?? "—"}
          detalle={conMermas[0] ? formatoPesos(conMermas[0].costoCentavos) : "Sin registros este mes"}
          icono="alerta"
          compacto
        />
      </div>
      {global.registros > 0 && <GraficaDias fechas={fechasDelPeriodo(mesActual)} dias={global.dias} descripcion="Todas las sucursales, este mes" />}

      <div className="grid gap-4 lg:grid-cols-5">
        <Ranking
          className="lg:col-span-2"
          titulo="Sucursales"
          descripcion="Este mes, por costo"
          vacio="Sin registros este mes."
          filas={conMermas.map((s) => ({
            clave: s.id,
            nombre: s.nombre,
            valor: s.costoCentavos,
            textoValor: formatoPesos(s.costoCentavos),
            detalle: veces(s.registros),
            href: rutaReporte("mes", mesActual.inicio, s.id),
          }))}
          accion={<Link href="/reportes/general" className={estiloBoton({ variante: "fantasma", tamano: "sm" })}>Resumen</Link>}
        />
        <Tarjeta titulo="Últimos registros" className="lg:col-span-3">
          <ListaMermas mermas={recientes.filas.slice(0, RECIENTES + 2)} mostrarUsuario mostrarSucursal vacio="Aún no hay registros." compacta />
        </Tarjeta>
      </div>

      {global.registros > 0 && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Ranking
            titulo="Productos con más merma"
            descripcion="Este mes, por costo"
            vacio="—"
            filas={global.productos.map((p) => ({
              clave: `${p.id}-${p.unidad}`,
              nombre: p.nombre,
              valor: p.costoCentavos,
              textoValor: formatoPesos(p.costoCentavos),
              detalle: veces(p.registros),
            }))}
          />
          <Ranking
            titulo="Motivos frecuentes"
            vacio="—"
            filas={global.motivos.slice(0, 5).map((m) => ({
              clave: m.id,
              nombre: m.nombre,
              valor: m.registros,
              textoValor: veces(m.registros),
              detalle: formatoPesos(m.costoCentavos),
            }))}
          />
          <Ranking
            titulo="Costo por categoría"
            vacio="—"
            filas={global.categorias.slice(0, 5).map((c) => ({
              clave: c.nombre,
              nombre: c.nombre,
              valor: c.costoCentavos,
              textoValor: formatoPesos(c.costoCentavos),
              detalle: `${porcentaje(c.costoCentavos, global.costoCentavos)} del costo`,
            }))}
          />
          <Barras titulo="Costo por día de la semana" descripcion="Este mes" barras={barrasDiaSemana(global.diasSemana)} />
        </div>
      )}
    </>
  );
}

const rango = (p: Periodo) => ({ desde: p.desde, hasta: p.hasta });
