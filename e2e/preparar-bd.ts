import { execSync } from "node:child_process";
import postgres from "postgres";

// Base de pruebas limpia: borra el esquema, aplica migraciones y carga datos iniciales.
export default async function prepararBd() {
  const url = process.env.DATABASE_URL_TEST;
  if (!url) throw new Error("Falta DATABASE_URL_TEST en .env");
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  await sql`drop schema if exists public cascade`;
  await sql`drop schema if exists drizzle cascade`;
  await sql`create schema public`;
  await sql.end();
  const env = { ...process.env, DATABASE_URL: url };
  execSync("pnpm exec drizzle-kit migrate", { env, stdio: "inherit" });
  execSync("pnpm exec tsx scripts/seed.ts --test", { env, stdio: "inherit" });
}
