# gestion-usuarios Specification

## Purpose
Alta, edición, desactivación y restablecimiento de contraseña de usuarios, por el administrador general (todos) y el gerente (empleados y encargados de su sucursal).
## Requirements
### Requirement: Alta de usuarios según rol
El administrador general SHALL poder crear usuarios de cualquier rol en cualquier sucursal. El gerente SHALL poder crear solo empleados y encargados de turno de su propia sucursal. Cada usuario MUST tener nombre completo, nombre de usuario único, contraseña inicial, rol y sucursal (salvo el administrador).

#### Scenario: Gerente crea empleado
- **WHEN** un gerente crea un empleado
- **THEN** el empleado queda asignado automáticamente a la sucursal del gerente

#### Scenario: Gerente intenta crear gerente
- **WHEN** un gerente intenta crear un usuario con rol gerente o administrador
- **THEN** el sistema lo rechaza

#### Scenario: Nombre de usuario repetido
- **WHEN** se intenta crear un usuario con un nombre de usuario ya existente
- **THEN** el sistema lo rechaza

### Requirement: Edición y desactivación de usuarios
Quien puede crear un usuario SHALL poder editar su nombre completo y rol (dentro de los roles que puede asignar) y desactivarlo o reactivarlo. Los usuarios no se borran, para conservar la autoría de sus registros.

#### Scenario: Desactivar usuario
- **WHEN** un gerente desactiva a un encargado de su sucursal
- **THEN** el encargado no puede iniciar sesión y sus registros siguen mostrando su nombre

#### Scenario: Usuario se desactiva a sí mismo
- **WHEN** un usuario intenta desactivarse a sí mismo
- **THEN** el sistema lo rechaza

### Requirement: Restablecimiento de contraseña
El administrador general y el gerente SHALL poder asignar una nueva contraseña a los usuarios que administran. Al restablecerla, las sesiones activas de ese usuario MUST invalidarse.

#### Scenario: Gerente restablece contraseña
- **WHEN** un gerente asigna una nueva contraseña a un empleado de su sucursal
- **THEN** el empleado solo puede entrar con la nueva contraseña y sus sesiones abiertas se cierran

