## Context

Proyecto nuevo, sin código previo. Las sucursales de Yogufrut reportan mermas por WhatsApp. Se construye una app web usada desde PC, tablet y celular (Chrome/Edge) por personal de sucursal con poca formación técnica: el registro de una merma debe tomar menos de 30 segundos. Requerimientos completos en `docs/requerimientos.md`; catálogos iniciales en `docs/*.csv`.

El trabajo se entrega en fases verticales: desde la fase 1 se puede iniciar sesión, registrar una merma y verla guardada.

## Goals / Non-Goals

**Goals:**
- Flujo login → registrar merma → "Mis registros" funcionando desde la fase 1.
- Autorización por rol y sucursal aplicada en el servidor en cada operación.
- Registros inmutables con costo congelado, listos para los reportes del siguiente cambio.
- Pocas piezas de infraestructura: una app Next.js y una base PostgreSQL.

**Non-Goals:**
- Historial con filtros, panel de reportes, reportes por periodo, exportación Excel/PDF y resumen del administrador (siguiente cambio).
- Recuperación de contraseña por correo (la restablece el gerente o el administrador).
- Modo sin conexión.

## Decisions

### Next.js App Router con Server Actions
Formularios con Server Actions y Server Components; sin API REST separada.
- *Alternativa:* API REST + SPA. Descartada: duplica validación y despliegue sin beneficio para una sola app.

### PostgreSQL + Drizzle ORM
Esquema en TypeScript y migraciones SQL generadas con `drizzle-kit`. Postgres local con `docker compose` para desarrollo.
- *Alternativa:* Prisma. Descartada: cliente más pesado; Drizzle queda más cerca de SQL y basta para este modelo.

### Sesiones propias en base de datos (sin Auth.js)
Tabla `sesiones` con token aleatorio (32 bytes) guardado como hash SHA-256; cookie `httpOnly`, `Secure`, `SameSite=Lax` con el token. Cada petición valida expiración por inactividad (30 min) y absoluta (8 h) y renueva `ultimo_acceso`. Contraseñas con argon2id (`@node-rs/argon2`). Restablecer contraseña o desactivar un usuario borra sus sesiones.
- *Alternativa:* Auth.js con proveedor de credenciales. Descartada: está pensado para OAuth, el soporte de credenciales es limitado y complica invalidar sesiones al restablecer contraseñas.
- *Alternativa:* JWT sin estado. Descartada: no permite cerrar sesiones de forma inmediata.

### Autorización centralizada
Una función `requireUsuario({ roles?, sucursalId? })` que usan todas las Server Actions, páginas y rutas. Las consultas de datos de sucursal siempre filtran por la sucursal de la sesión (excepto el administrador). El menú se oculta según el rol, pero la seguridad la da el servidor.

### Modelo de datos
- `sucursales` (id, nombre único sin distinguir mayúsculas, activa)
- `usuarios` (id, usuario único, nombre_completo, rol enum, sucursal_id nullable solo para administrador — validado con CHECK, password_hash, activo)
- `sesiones` (token_hash, usuario_id, creada, ultimo_acceso)
- `productos` (id, categoria, nombre único, unidad enum L/kg/pz, costo_unitario numeric(10,2), activo)
- `motivos` (id, nombre único, activo)
- `mermas` (id, sucursal_id, usuario_id, producto_id, motivo_id, cantidad numeric(10,3), unidad, costo_unitario, costo_total, observaciones, creada_en timestamptz, clave_envio uuid único, cancelada_en, cancelada_por, motivo_cancelacion)
- `fotos_merma` (merma_id, tipo_mime, bytes bytea)

`unidad`, `costo_unitario` y `costo_total` se copian al registro para que los cambios del catálogo no alteren la historia. Los montos se guardan como `numeric`, nunca como float.

### Doble clic y duplicados
- Cada formulario lleva un `clave_envio` (UUID generado al cargar el formulario) con restricción UNIQUE: un segundo envío igual no crea otro registro.
- Antes de insertar se busca una merma del mismo usuario, producto y cantidad en los últimos 5 minutos; si existe, la acción devuelve "posible duplicado" y la UI pide confirmación, que reenvía la acción con `confirmarDuplicado=true`.

### Fotos en PostgreSQL (bytea)
La imagen se reduce en el navegador (máximo 1600 px, WebP) antes de subirla; el servidor valida tipo y tamaño (≤ 5 MB) y la guarda en `fotos_merma`. Se sirve por una ruta que aplica la misma autorización que el registro.
- *Alternativa:* almacenamiento de objetos (S3/R2). Descartada por ahora: agrega servicio y credenciales. Límite conocido: con miles de fotos la base crece; migrar a almacenamiento de objetos cuando pase de unos GB.

### Validación con Zod
Un esquema por formulario, compartido entre cliente (mensajes inmediatos) y servidor (fuente de verdad).

### Fechas
`timestamptz` en UTC; se muestran con `Intl.DateTimeFormat('es-MX', { timeZone: 'America/Monterrey' })`, formato `dd/mm/aaaa` y hora de 12 h.

### UI
Tailwind CSS, enfoque móvil primero, botones grandes. El registro de merma es la pantalla de inicio para empleado, encargado y gerente. Selector de producto con búsqueda y agrupado por categoría (78 productos).

### Pruebas
- Unitarias (Vitest): reglas de permisos, cálculo de costo, detección de duplicado, expiración de sesión.
- E2E (Playwright): el flujo de cada fase (login → registrar → ver), contra una base de pruebas.

## Risks / Trade-offs

- [Contraseñas débiles o compartidas entre turnos] → mínimo 8 caracteres, cuentas personales, el gerente puede restablecer y desactivar.
- [Ataques de fuerza bruta al login] → mensaje genérico y retraso progresivo por usuario tras 5 intentos fallidos.
- [Fotos llenando la base] → compresión en el navegador y límite de 5 MB; migrar a almacenamiento de objetos si crece.
- [Costos estimados en el catálogo inicial] → el administrador los corrige; el registro congela el costo al momento de capturar.
- [Hosting no definido] → la app solo requiere Node y PostgreSQL; se define antes del despliegue.

## Migration Plan

Proyecto nuevo, sin migración de datos. Despliegue: aplicar migraciones de Drizzle, ejecutar la carga inicial (idempotente) y crear el administrador real cambiando la contraseña semilla. Rollback: volver a la versión anterior de la app; las migraciones de este cambio solo crean tablas.

## Open Questions

- Proveedor de hosting y de PostgreSQL para producción (p. ej. Vercel + Neon, o un VPS).
- Datos del primer administrador real.
