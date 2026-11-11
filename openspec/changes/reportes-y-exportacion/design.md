## Context

El registro de mermas ya funciona (Next.js 16 + SQLite vía libsql/Drizzle). Cada merma guarda sucursal, usuario, producto, motivo, cantidad en milésimas, costo congelado en centavos y `creada_en` en milisegundos UTC; los cancelados tienen `cancelada_en`. Existe la vista `/sucursal` (lista paginada sin filtros) y el detalle `/mermas/[id]`. Faltan filtros, agregados por periodo y exportación (RF10–RF15).

## Goals / Non-Goals

**Goals:**
- Historial filtrable con totales del resultado completo.
- Panel por periodo (día/semana/mes) y resumen general para el administrador.
- Exportar Excel y PDF del periodo con los mismos datos del panel.
- Una sola función de datos del reporte para panel, Excel y vista imprimible.

**Non-Goals:**
- Gráficas con librerías; comparativos entre periodos; envío por correo.
- Reportes de varias sucursales en un mismo archivo.

## Decisions

### Periodos y zona horaria calculados en JavaScript
Un módulo puro `periodos.ts` convierte (tipo, fecha de referencia) en `{ desde, hasta }` en ms UTC usando `Intl.DateTimeFormat` con `America/Monterrey` para obtener el desfase de cada límite, y calcula anterior/siguiente. Semana: lunes a domingo.
- *Alternativa:* convertir zona en SQL. Descartada: SQLite no trae base de zonas horarias.

### Agregados en SQL, desglose por día con desfase fijo
Totales y rankings con `GROUP BY` sobre `mermas` filtrado por sucursal y rango (índice `(sucursal_id, creada_en)`), excluyendo cancelados. El desglose por día usa `strftime('%Y-%m-%d', creada_en / 1000 + desfase, 'unixepoch')` con el desfase del inicio del periodo.
- Límite conocido: si una zona cambia de horario dentro del periodo, el día del cambio puede desfasarse una hora. Monterrey no aplica horario de verano desde 2022.

### Filtros en la URL
`searchParams` validados con Zod (`desde`, `hasta`, `producto`, `motivo`, `usuario`, `estado`, `pagina`, `sucursal` solo para admin). Los formularios de filtro usan `method="get"`: funcionan sin JavaScript y la URL se puede compartir. El servidor fuerza la sucursal del usuario si no es admin.

### Función única de datos del reporte
`obtenerReporte(sucursalId, periodo)` devuelve totales, productos, motivos, empleados y días; `obtenerRegistrosDelPeriodo` devuelve el detalle para exportar. Panel, Excel e impresión la reutilizan, así los tres muestran lo mismo.

### Excel con `exceljs` en una ruta GET
`/reportes/excel?sucursal&tipo&fecha` genera el `.xlsx` en memoria (hojas "Resumen" y "Registros", montos como número con formato de moneda) y responde con `Content-Disposition: attachment`. Autoriza gerente (su sucursal) y admin.
- *Alternativa:* CSV. Descartada: no admite dos hojas ni formato, y Excel abre mal los acentos sin BOM.

### PDF con vista imprimible
`/reportes/imprimir` fuera del layout con menú, con CSS `@media print` y tamaño carta; un componente cliente llama `window.print()` al cargar. Chrome y Edge guardan como PDF. Sin dependencia nueva (decisión del usuario).

### Interfaz: sistema de diseño y sidebar
Paleta propia en tokens de Tailwind (`arena` neutros cálidos, `frambuesa` acento único, `menta`/`miel`/`rojo` semánticos), Bricolage Grotesque para títulos y cifras y Geist para texto. Componentes compartidos en `src/components/ui` (botón, tarjeta, indicador, campo, encabezado, estado vacío, insignia, aviso, íconos SVG propios). Navegación en sidebar agrupado por rol, contraíble a íconos (preferencia en cookie para evitar parpadeo) y cajón accesible en celular. `/` es un dashboard por rol; el registro vive en `/registrar`.

### Permisos
`puedeVerReportes(rol)`: encargado, gerente y admin. `puedeExportar(rol)`: gerente y admin. Se agregan a `permisos.ts` con pruebas. El menú muestra "Historial" y "Reportes" a encargado y gerente; el admin ve "Reportes" (resumen general) e "Historial".

## Risks / Trade-offs

- [Muchos registros en un mes] → agregados en SQL; la exportación de detalle se limita a 10 000 filas con aviso si se excede.
- [Impresión depende del navegador] → probado en Chrome/Edge (navegadores objetivo); márgenes y saltos de página con CSS de impresión.
- [Costos del catálogo estimados] → los reportes en pesos reflejan los costos capturados; el administrador debe corregir el catálogo.

## Migration Plan

Sin cambios de esquema. `/sucursal` pasa a ser el historial con filtros (misma ruta). Desplegar y verificar.

## Open Questions

Ninguna.
