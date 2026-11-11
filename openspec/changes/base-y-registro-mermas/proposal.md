## Why

Hoy las sucursales de Yogufrut reportan sus mermas por WhatsApp: no queda un registro estructurado, no se sabe con certeza quién reportó, y no es posible sumar cantidades ni costos. Este primer cambio crea la base del sistema y permite capturar mermas de forma centralizada, que es el dato del que dependen el historial y los reportes posteriores.

## What Changes

- Nuevo proyecto web Next.js (TypeScript) con base de datos PostgreSQL.
- Inicio de sesión con usuario y contraseña; sesión que identifica nombre, puesto (rol) y sucursal del usuario.
- Cuatro roles con permisos: empleado, encargado de turno, gerente y administrador general.
- Catálogo de sucursales (alta, edición, desactivación) administrado por el administrador general.
- Gestión de usuarios: el administrador crea cualquier usuario; el gerente crea empleados y encargados de su sucursal; ambos pueden restablecer contraseñas de los usuarios que administran.
- Catálogo de productos (categoría, unidad de medida, costo unitario) y catálogo de motivos, administrados por el administrador general, con carga inicial desde `docs/catalogo-productos.csv` y `docs/catalogo-motivos.csv`.
- Registro de mermas: producto del catálogo, cantidad, motivo, observaciones y foto opcional; el sistema guarda automáticamente fecha, hora, usuario y sucursal, y congela el costo unitario vigente.
- Aviso de posible duplicado (mismo usuario, producto y cantidad en menos de 5 minutos).
- Cancelación de registros con motivo (gerente de la sucursal o administrador); los registros no se editan ni se borran.
- Vista "Mis registros" para que cada usuario consulte las mermas que capturó.

Entrega en fases verticales, cada una funcionando de punta a punta:
1. **Flujo mínimo:** login con usuarios semilla → registrar merma → ver "Mis registros".
2. **Registro completo:** foto opcional, aviso de duplicado, cancelación con motivo, expiración de sesión.
3. **Administración:** gestión de sucursales, usuarios (admin y gerente) y catálogos.

Fuera de alcance (cambios posteriores): historial por sucursal con filtros, panel de reportes, reportes por día/semana/mes, exportación a Excel/PDF y resumen general del administrador.

## Capabilities

### New Capabilities
- `autenticacion`: inicio y cierre de sesión, expiración de sesión, reglas de contraseña e identificación del usuario (nombre, rol, sucursal).
- `control-acceso`: definición de los cuatro roles y reglas de qué puede ver y hacer cada uno, incluida la restricción por sucursal.
- `gestion-sucursales`: alta, edición y desactivación de sucursales.
- `gestion-usuarios`: alta, edición, desactivación y restablecimiento de contraseña de usuarios según rol.
- `catalogos`: catálogo de productos (categoría, unidad, costo unitario) y catálogo de motivos de merma, con datos iniciales.
- `registro-mermas`: captura de mermas, foto opcional, aviso de duplicado, cancelación con motivo y consulta de los registros propios.

### Modified Capabilities
<!-- Ninguna: no existen specs previas. -->

## Impact

- Código nuevo: aplicación Next.js completa (rutas, componentes, acciones de servidor), esquema de base de datos y migraciones, script de datos iniciales (seed).
- Dependencias nuevas: Next.js, ORM/cliente PostgreSQL, librería de hash de contraseñas, almacenamiento de archivos para fotos.
- Infraestructura: base de datos PostgreSQL y almacenamiento de imágenes; variables de entorno para credenciales.
- Seguridad: manejo de contraseñas (hash), sesiones y autorización por rol y sucursal en cada operación del servidor.
