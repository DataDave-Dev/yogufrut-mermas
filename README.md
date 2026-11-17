# Mermas Yogufrut

Registro y control de mermas de las sucursales Yogufrut. Requerimientos en `docs/requerimientos.md`; plan de trabajo en `openspec/changes/`.

## Requisitos

- Node 20.12+ y pnpm
- Nada más: la base es un archivo SQLite en `data/` (se crea solo)

## Arranque

```bash
pnpm install
cp .env.example .env
pnpm db:migrate               # crea las tablas
pnpm db:seed                  # catálogos, Sucursal Sendero, usuarios de prueba y modo WAL (idempotente)
pnpm db:demo                  # opcional: 9 sucursales más, su personal y 60 días de mermas (solo desarrollo)
pnpm dev                      # http://localhost:3001
```

Corre `db:seed` y `db:demo` con `pnpm dev` detenido (o reinícialo después): al terminar borran los archivos
`-wal`/`-shm` de SQLite y un servidor encendido deja de poder escribir.

Usuarios de prueba (contraseña = `SEED_PASSWORD` del `.env`): `empleado`, `encargado`, `gerente` (Sucursal Sendero) y `admin`.

## Pruebas

```bash
pnpm test                     # unitarias (Vitest)
pnpm test:e2e                 # E2E (Playwright); recrea el archivo DATABASE_URL_TEST
```

## Cambios al esquema

Edita `src/db/schema.ts`, luego `pnpm db:generate --name <descripcion>` y `pnpm db:migrate`.

## Producción

SQLite necesita disco persistente (VPS, Railway, Fly.io con volumen, etc.). En plataformas sin disco persistente
(p. ej. Vercel) usa Turso: `DATABASE_URL=libsql://<base>.turso.io` y `DATABASE_AUTH_TOKEN`, sin cambiar código.
Respalda el archivo `data/mermas.db` (o usa los respaldos de Turso).
