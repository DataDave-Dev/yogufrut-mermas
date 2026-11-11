# autenticacion Specification

## Purpose
Inicio y cierre de sesión con usuario y contraseña, expiración de sesión, almacenamiento seguro de contraseñas e identificación del usuario (nombre, puesto y sucursal).
## Requirements
### Requirement: Inicio de sesión con usuario y contraseña
El sistema SHALL permitir iniciar sesión con nombre de usuario y contraseña. Solo los usuarios activos de sucursales activas (o el administrador general) MUST poder iniciar sesión.

#### Scenario: Credenciales válidas
- **WHEN** un usuario activo ingresa su usuario y contraseña correctos
- **THEN** el sistema crea una sesión y lo lleva a la pantalla de registro de merma

#### Scenario: Credenciales inválidas
- **WHEN** un usuario ingresa un usuario inexistente o una contraseña incorrecta
- **THEN** el sistema muestra "Usuario o contraseña incorrectos" sin indicar cuál de los dos falló

#### Scenario: Usuario desactivado
- **WHEN** un usuario desactivado ingresa credenciales correctas
- **THEN** el sistema rechaza el acceso con el mismo mensaje genérico

#### Scenario: Sucursal desactivada
- **WHEN** un usuario de una sucursal desactivada ingresa credenciales correctas
- **THEN** el sistema rechaza el acceso

### Requirement: Identificación del usuario en sesión
Tras iniciar sesión, el sistema SHALL mostrar el nombre completo, el puesto y la sucursal del usuario en todas las pantallas.

#### Scenario: Encabezado con datos del usuario
- **WHEN** un encargado de turno de "Sucursal Sendero" navega por el sistema
- **THEN** el encabezado muestra su nombre completo, "Encargado de turno" y "Sucursal Sendero"

#### Scenario: Administrador sin sucursal
- **WHEN** el administrador general navega por el sistema
- **THEN** el encabezado muestra su nombre y "Administrador general" sin sucursal fija

### Requirement: Cierre y expiración de sesión
El sistema SHALL permitir cerrar sesión manualmente. La sesión MUST expirar tras 30 minutos sin actividad o 8 horas desde el inicio, lo que ocurra primero.

#### Scenario: Cerrar sesión
- **WHEN** el usuario elige "Cerrar sesión"
- **THEN** la sesión se invalida y se muestra la pantalla de inicio de sesión

#### Scenario: Inactividad
- **WHEN** pasan 30 minutos sin peticiones del usuario
- **THEN** la siguiente petición redirige al inicio de sesión

#### Scenario: Duración máxima
- **WHEN** pasan 8 horas desde el inicio de sesión aunque haya actividad
- **THEN** la siguiente petición redirige al inicio de sesión

### Requirement: Almacenamiento seguro de contraseñas
Las contraseñas MUST guardarse solo como hash con sal y MUST tener al menos 8 caracteres.

#### Scenario: Contraseña corta
- **WHEN** se intenta asignar una contraseña de menos de 8 caracteres
- **THEN** el sistema la rechaza con un mensaje claro

#### Scenario: Contraseña nunca en texto plano
- **WHEN** se guarda o cambia una contraseña
- **THEN** la base de datos contiene únicamente su hash

