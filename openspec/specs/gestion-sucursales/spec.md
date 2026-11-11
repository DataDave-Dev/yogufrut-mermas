# gestion-sucursales Specification

## Purpose
Alta, edición y desactivación de las sucursales de Yogufrut por el administrador general, conservando sus registros.
## Requirements
### Requirement: Alta y edición de sucursales
El administrador general SHALL poder crear sucursales y editar su nombre. El nombre MUST ser único (sin distinguir mayúsculas).

#### Scenario: Crear sucursal
- **WHEN** el administrador crea "Sucursal Cumbres"
- **THEN** la sucursal aparece en el listado como activa

#### Scenario: Nombre duplicado
- **WHEN** el administrador intenta crear "sucursal sendero" y ya existe "Sucursal Sendero"
- **THEN** el sistema rechaza la operación indicando que el nombre ya existe

### Requirement: Desactivación de sucursales
El administrador general SHALL poder desactivar y reactivar sucursales. Las sucursales no se borran; sus registros MUST conservarse.

#### Scenario: Desactivar sucursal
- **WHEN** el administrador desactiva una sucursal
- **THEN** sus usuarios no pueden iniciar sesión y sus mermas siguen guardadas

