# Mermas Yogufrut

Registro y control de mermas de las sucursales Yogufrut. Requerimientos en `docs/requerimientos.md`; plan de trabajo en `openspec/changes/`.

## Requisitos

- Node 20.12+ y pnpm
- PostgreSQL 16+ (local, o `docker compose up -d`)

## Arranque

```bash
pnpm install
cp .env.example .env          # ajusta DATABASE_URL
pnpm db:migrate               # crea las tablas
pnpm db:seed                  # catálogos, Sucursal Sendero y usuarios de prueba (idempotente)
pnpm dev                      # http://localhost:3001
```

Usuarios de prueba (contraseña = `SEED_PASSWORD` del `.env`): `empleado`, `encargado`, `gerente` (Sucursal Sendero) y `admin`.

## Pruebas

```bash
pnpm test                     # unitarias (Vitest)
pnpm test:e2e                 # E2E (Playwright); recrea la base DATABASE_URL_TEST
```

## Cambios al esquema

Edita `src/db/schema.ts`, luego `pnpm db:generate --name <descripcion>` y `pnpm db:migrate`.
