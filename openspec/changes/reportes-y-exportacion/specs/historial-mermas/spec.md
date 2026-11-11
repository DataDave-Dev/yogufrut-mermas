## ADDED Requirements

### Requirement: Historial de la sucursal
El encargado de turno y el gerente SHALL consultar el historial de mermas de su sucursal. El administrador general SHALL elegir la sucursal a consultar. Cada registro MUST mostrar fecha, hora, producto, cantidad, unidad, motivo, costo, quién lo registró y su estado, ordenados del más reciente al más antiguo, paginados de 50 en 50, con acceso a su detalle.

#### Scenario: Encargado consulta su sucursal
- **WHEN** un encargado de "Sucursal Sendero" abre el historial
- **THEN** ve los registros de todos los usuarios de Sucursal Sendero con el nombre de quién registró cada uno

#### Scenario: Empleado sin acceso
- **WHEN** un empleado abre la URL del historial
- **THEN** el sistema responde con acceso denegado

#### Scenario: Gerente no consulta otra sucursal
- **WHEN** un gerente agrega a la URL el identificador de otra sucursal
- **THEN** el sistema ignora el parámetro y muestra solo su sucursal

### Requirement: Filtros del historial
El historial SHALL filtrar por rango de fechas (desde/hasta, inclusivo, en zona `America/Monterrey`), producto, motivo, usuario que registró y estado (activos, cancelados o todos; por defecto activos). Los filtros MUST combinarse entre sí y conservarse en la URL para poder compartirla o recargarla.

#### Scenario: Filtrar por motivo y fechas
- **WHEN** el gerente filtra motivo "Caducidad" del 01/11/2026 al 10/11/2026
- **THEN** solo ve registros con ese motivo creados en esos días

#### Scenario: Filtro de usuario limitado a la sucursal
- **WHEN** el gerente despliega el filtro de usuario
- **THEN** solo aparecen usuarios de su sucursal

#### Scenario: Fechas invertidas
- **WHEN** la fecha "desde" es posterior a "hasta"
- **THEN** el sistema muestra un aviso y no aplica el rango

### Requirement: Totales del resultado
El historial SHALL mostrar el número de registros y el costo total del resultado filtrado completo (no solo de la página). Los registros cancelados MUST excluirse del costo total.

#### Scenario: Totales con varias páginas
- **WHEN** un filtro devuelve 120 registros
- **THEN** el historial indica 120 registros y su costo total, aunque muestre 50 por página
