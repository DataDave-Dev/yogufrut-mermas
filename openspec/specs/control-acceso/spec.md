# control-acceso Specification

## Purpose
Roles del sistema (empleado, encargado de turno, gerente y administrador general) y reglas de qué puede ver y hacer cada uno, aplicadas en el servidor y restringidas por sucursal.
## Requirements
### Requirement: Cuatro roles
El sistema SHALL contemplar los roles empleado, encargado de turno, gerente y administrador general. Todo usuario MUST tener exactamente un rol. Todo usuario que no sea administrador general MUST pertenecer a exactamente una sucursal.

#### Scenario: Usuario de sucursal sin sucursal
- **WHEN** se intenta crear un empleado, encargado o gerente sin sucursal
- **THEN** el sistema rechaza la operación

### Requirement: Autorización en el servidor
Cada operación SHALL validar rol y sucursal en el servidor, independientemente de lo que muestre la interfaz.

#### Scenario: Acceso directo a ruta no permitida
- **WHEN** un empleado abre directamente la URL de gestión de usuarios
- **THEN** el sistema responde con acceso denegado

#### Scenario: Acceso a datos de otra sucursal
- **WHEN** un gerente de "Sucursal Sendero" solicita un registro de otra sucursal
- **THEN** el sistema responde con acceso denegado

### Requirement: Matriz de permisos de este cambio
El sistema SHALL aplicar estos permisos:
- Empleado y encargado de turno: registrar mermas y consultar sus propios registros.
- Gerente: lo anterior, más cancelar registros de su sucursal y gestionar empleados y encargados de su sucursal.
- Administrador general: cancelar registros de cualquier sucursal y gestionar sucursales, todos los usuarios y los catálogos.

#### Scenario: Empleado intenta cancelar
- **WHEN** un empleado intenta cancelar un registro
- **THEN** el sistema lo rechaza

#### Scenario: Gerente gestiona catálogo
- **WHEN** un gerente intenta modificar el catálogo de productos
- **THEN** el sistema lo rechaza

#### Scenario: Menú según rol
- **WHEN** un empleado inicia sesión
- **THEN** el menú muestra solo "Registrar merma" y "Mis registros"

