# exportacion Specification

## Purpose
Exportación del reporte del periodo a Excel (.xlsx con resumen y detalle) y vista imprimible para guardar como PDF.
## Requirements
### Requirement: Exportar a Excel
El gerente (de su sucursal) y el administrador general SHALL descargar el reporte del periodo como archivo `.xlsx` con dos hojas: "Resumen" (sucursal, periodo, total de registros, costo total, productos, motivos y empleados) y "Registros" (fecha, hora, usuario, puesto, producto, cantidad, unidad, motivo, costo unitario, costo total y observaciones de cada registro no cancelado del periodo). El nombre del archivo MUST incluir la sucursal y el periodo.

#### Scenario: Descarga del mes
- **WHEN** el gerente de Sucursal Sendero descarga el Excel de noviembre 2026
- **THEN** recibe `mermas-sucursal-sendero-2026-11.xlsx` con las hojas "Resumen" y "Registros"

#### Scenario: Encargado sin exportación
- **WHEN** un encargado solicita la descarga directamente por URL
- **THEN** el sistema responde con acceso denegado

#### Scenario: Gerente de otra sucursal
- **WHEN** un gerente solicita el Excel de otra sucursal
- **THEN** el sistema responde con acceso denegado

### Requirement: Vista imprimible para PDF
El gerente y el administrador general SHALL abrir una vista imprimible del reporte del periodo (resumen + detalle) con formato de hoja carta, sin menús ni botones al imprimir, que Chrome y Edge pueden guardar como PDF desde el diálogo de impresión.

#### Scenario: Guardar como PDF
- **WHEN** el gerente elige "Imprimir / PDF"
- **THEN** se abre la vista imprimible y el diálogo de impresión del navegador

#### Scenario: Contenido impreso
- **WHEN** se imprime la vista
- **THEN** la hoja muestra encabezado con sucursal y periodo, el resumen y la tabla de registros, sin la navegación de la aplicación

