## Why

Con el registro de mermas funcionando, las sucursales y el administrador ya tienen datos, pero no pueden analizarlos: no hay filtros, ni totales por periodo, ni forma de saber qué productos y motivos generan más pérdida, ni de entregar un reporte fuera del sistema. Este cambio cubre RF10–RF15 y el módulo de reportes de `docs/requerimientos.md`, completando el reemplazo del registro por WhatsApp.

## What Changes

- Historial de mermas por sucursal con filtros por rango de fechas, producto, motivo, usuario y estado (activos/cancelados), con total de registros y costo del resultado. Reemplaza la vista "Registros de la sucursal" sin filtros. Ahora también accede el encargado de turno.
- Panel de reportes por sucursal para un periodo (día, semana lun–dom o mes, navegable): total de registros y costo, productos con más merma, motivos más frecuentes, mermas por empleado y desglose por día. Excluye registros cancelados.
- Resumen general para el administrador: totales del periodo por sucursal, con acceso al reporte de cada una.
- Exportación del reporte del periodo (resumen + detalle de registros): Excel `.xlsx` con hojas "Resumen" y "Registros", y vista imprimible para guardar como PDF desde Chrome/Edge. Disponible para gerente y administrador.

Entrega en fases verticales, cada una funcionando de punta a punta:
1. **Historial con filtros:** filtrar → ver registros y totales → abrir detalle.
2. **Panel de reportes:** elegir periodo → ver indicadores y rankings; resumen general del administrador.
3. **Exportación:** descargar Excel e imprimir/guardar PDF del periodo.

Fuera de alcance: gráficas avanzadas, comparativos entre periodos, envío automático de reportes por correo.

## Capabilities

### New Capabilities
- `historial-mermas`: consulta de registros de una sucursal con filtros, totales del resultado y paginación.
- `reportes`: panel de reportes por periodo (día/semana/mes) por sucursal y resumen general del administrador.
- `exportacion`: exportación del reporte del periodo a Excel y vista imprimible para PDF.

### Modified Capabilities
- `control-acceso`: la matriz de permisos agrega historial y panel para encargado y gerente, exportación para gerente y administrador.
- `registro-mermas`: se retira "Registros de la sucursal para cancelación", reemplazado por `historial-mermas`.

## Impact

- Código: nuevas pantallas de historial, reportes, resumen general y vista imprimible; consultas agregadas en SQL; ruta de descarga de Excel.
- Dependencia nueva: `exceljs` para generar `.xlsx`.
- Base de datos: sin cambios de esquema; consultas sobre índices existentes `(sucursal_id, creada_en)`.
