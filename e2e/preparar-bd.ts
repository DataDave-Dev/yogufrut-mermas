// Base de pruebas limpia: borra el archivo SQLite, aplica migraciones y carga datos iniciales.
// Corre antes de arrancar el servidor de pruebas (ver playwright.config.ts), para que el
// servidor nunca quede apuntando a un archivo borrado.
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

try { process.loadEnvFile(); } catch {}

const url = process.env.DATABASE_URL_TEST;
if (!url?.startsWith("file:")) throw new Error("DATABASE_URL_TEST debe ser un archivo local (file:...)");
const archivo = url.slice("file:".length);
for (const sufijo of ["", "-wal", "-shm"]) rmSync(archivo + sufijo, { force: true });

const env = { ...process.env, DATABASE_URL: url };
execSync("pnpm exec drizzle-kit migrate", { env, stdio: "inherit" });
execSync("pnpm exec tsx scripts/seed.ts --test", { env, stdio: "inherit" });
