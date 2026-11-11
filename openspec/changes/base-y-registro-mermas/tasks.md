## 1. Fase 1 — Flujo mínimo: login → registrar merma → Mis registros

- [x] 1.1 Crear proyecto Next.js (App Router, TypeScript, Tailwind, ESLint) y `docker-compose.yml` con PostgreSQL; `.env.example` con `DATABASE_URL`
- [x] 1.2 Configurar Drizzle: tablas `sucursales`, `usuarios`, `sesiones`, `productos`, `motivos`, `mermas` según design.md; generar y aplicar la primera migración
- [x] 1.3 Script de carga inicial idempotente: productos y motivos desde `docs/*.csv`, "Sucursal Sendero" y un usuario de cada rol con contraseña de desarrollo
- [x] 1.4 Sesiones: hash argon2id, creación de sesión, cookie segura, validación de expiración (30 min de inactividad / 8 h máximo), `requireUsuario()`
- [x] 1.5 Pantalla de inicio de sesión con mensaje genérico de error y cierre de sesión
- [x] 1.6 Layout con encabezado (nombre, puesto, sucursal) y menú según rol
- [x] 1.7 Formulario "Registrar merma": producto con búsqueda por categoría, unidad automática, cantidad, motivo, observaciones; validación con Zod en cliente y servidor
- [x] 1.8 Server Action que guarda la merma con sucursal, usuario, fecha y costo tomados de la sesión y del catálogo; `clave_envio` única contra doble clic; confirmación con costo calculado
- [x] 1.9 Pantalla "Mis registros": lista de las mermas del usuario, más reciente primero, con fecha/hora en `America/Monterrey`
- [x] 1.10 Pruebas unitarias de expiración de sesión y cálculo de costo; prueba E2E del flujo login → registrar → ver en Mis registros
- [ ] 1.11 Verificación manual: entrar como empleado de Sucursal Sendero, registrar 3 L de "Base de yogurt de fresa" por "Caducidad", verla en Mis registros con su costo; un usuario con contraseña incorrecta no entra

## 2. Fase 2 — Registro completo: foto, duplicados y cancelación

- [ ] 2.1 (Tabla `fotos_merma` ya creada en la migración inicial) Adjuntar foto opcional (reducción en navegador a WebP, validación de tipo y 5 MB en servidor)
- [ ] 2.2 Ruta protegida para ver la foto y detalle del registro con foto
- [ ] 2.3 Aviso de posible duplicado (mismo usuario, producto y cantidad en 5 minutos) con confirmación en la UI
- [ ] 2.4 Pantalla "Registros de la sucursal" para gerente (su sucursal) y administrador (selector de sucursal), paginada de 50 en 50, con nombre de quién registró
- [ ] 2.5 Cancelación con motivo obligatorio (gerente de su sucursal, administrador), guarda quién y cuándo; estado "Cancelado" visible en Mis registros
- [ ] 2.6 Retraso progresivo del login tras 5 intentos fallidos
- [ ] 2.7 Pruebas unitarias de permisos de cancelación y detección de duplicado; E2E: registrar con foto → aviso de duplicado → gerente cancela → empleado lo ve cancelado
- [ ] 2.8 Verificación manual: empleado registra con foto y repite el registro (aparece el aviso); el gerente lo cancela con motivo; el empleado lo ve cancelado; un empleado no puede abrir la URL de cancelación

## 3. Fase 3 — Administración: sucursales, usuarios y catálogos

- [ ] 3.1 Gestión de sucursales (administrador): listar, crear, renombrar, desactivar/reactivar; nombre único sin distinguir mayúsculas
- [ ] 3.2 Al iniciar sesión y en cada petición, rechazar usuarios inactivos o de sucursales desactivadas
- [ ] 3.3 Gestión de usuarios: administrador (todos los roles y sucursales) y gerente (empleados y encargados de su sucursal); crear, editar, desactivar; nadie puede desactivarse a sí mismo
- [ ] 3.4 Restablecer contraseña (administrador y gerente) invalidando las sesiones del usuario
- [ ] 3.5 Catálogo de productos (administrador): crear, editar categoría/unidad/costo, desactivar; los productos inactivos no aparecen al registrar
- [ ] 3.6 Catálogo de motivos (administrador): crear, renombrar, desactivar
- [ ] 3.7 Pruebas unitarias de la matriz de permisos de gestión; E2E: administrador crea sucursal y gerente → gerente crea empleado → empleado entra y registra
- [ ] 3.8 Verificación manual: administrador crea "Sucursal Cumbres" y su gerente; el gerente crea un empleado y le restablece la contraseña; el empleado registra una merma; el administrador cambia el costo de un producto y la merma anterior conserva su costo; al desactivar la sucursal su personal ya no puede entrar
