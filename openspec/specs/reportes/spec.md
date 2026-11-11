# reportes Specification

## Purpose
Panel de reportes por periodo (día, semana o mes) por sucursal, con indicadores, rankings y desglose por día, y resumen general de todas las sucursales para el administrador.
## Requirements
### Requirement: Periodo del reporte
El panel de reportes SHALL mostrar un periodo de tipo día, semana (lunes a domingo) o mes calendario, en zona `America/Monterrey`, por defecto el mes actual, con navegación al periodo anterior y siguiente. El periodo MUST conservarse en la URL.

#### Scenario: Semana
- **WHEN** el usuario elige "Semana" estando en el miércoles 11/11/2026
- **THEN** el reporte cubre del lunes 09/11/2026 al domingo 15/11/2026

#### Scenario: Navegar al mes anterior
- **WHEN** el usuario está en noviembre 2026 y elige "anterior"
- **THEN** el reporte muestra octubre 2026

### Requirement: Panel de reportes de la sucursal
El encargado de turno y el gerente SHALL ver el panel de reportes de su sucursal; el administrador general SHALL elegir la sucursal. Para el periodo, el panel MUST mostrar: nombre de la sucursal, total de registros, costo total, productos con más merma (ordenados por costo, con número de registros y cantidad), motivos más frecuentes (con número de registros y costo), mermas por empleado (registros y costo) y desglose por día. Los registros cancelados MUST excluirse.

#### Scenario: Panel del mes
- **WHEN** un gerente de Sucursal Sendero abre el panel en noviembre 2026
- **THEN** ve "Sucursal Sendero", el total de registros y costo de noviembre, y los rankings de productos, motivos y empleados

#### Scenario: Cancelados excluidos
- **WHEN** un registro del periodo está cancelado
- **THEN** no cuenta en totales, rankings ni desglose

#### Scenario: Periodo sin registros
- **WHEN** el periodo no tiene mermas
- **THEN** el panel indica que no hay registros en el periodo

#### Scenario: Acceso al detalle desde el panel
- **WHEN** el usuario elige un producto del ranking
- **THEN** el sistema abre el historial filtrado por ese producto y el periodo

### Requirement: Resumen general del administrador
El administrador general SHALL ver, para el periodo elegido, una tabla con cada sucursal, su número de registros y costo total, ordenada por costo, más el total general, con acceso al panel de cada sucursal.

#### Scenario: Resumen del mes
- **WHEN** el administrador abre el resumen general de noviembre 2026
- **THEN** ve cada sucursal con sus registros y costo del mes y el total de todas

#### Scenario: Gerente sin acceso al resumen general
- **WHEN** un gerente abre la URL del resumen general
- **THEN** el sistema responde con acceso denegado

