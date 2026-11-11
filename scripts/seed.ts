// Carga inicial idempotente: catálogos desde docs/*.csv, sucursal de prueba y un usuario por rol.
import { readFileSync } from "node:fs";
import { hash } from "@node-rs/argon2";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as s from "../src/db/schema";

try { process.loadEnvFile(); } catch {}

const url = process.argv.includes("--test") ? process.env.DATABASE_URL_TEST : process.env.DATABASE_URL;
const password = process.env.SEED_PASSWORD;
if (!url || !password) throw new Error("Faltan DATABASE_URL(_TEST) o SEED_PASSWORD en .env");

// ponytail: split simple; los CSV del repo no llevan comas dentro de los campos.
function leerCsv(ruta: string): Record<string, string>[] {
  const [encabezado, ...filas] = readFileSync(ruta, "utf8").trim().split("\n");
  const columnas = encabezado.split(",");
  return filas.map((f) => Object.fromEntries(f.split(",").map((v, i) => [columnas[i], v.trim()])));
}

const cliente = postgres(url, { max: 1 });
const db = drizzle(cliente, { schema: s });

async function main() {
  const productos = leerCsv("docs/catalogo-productos.csv").map((p) => ({
    categoria: p.categoria,
    nombre: p.producto,
    unidad: p.unidad as "L" | "kg" | "pz",
    costoUnitario: p.costo_unitario_mxn,
  }));
  await db.insert(s.productos).values(productos).onConflictDoNothing();

  const motivos = leerCsv("docs/catalogo-motivos.csv").map((m) => ({ nombre: m.motivo }));
  await db.insert(s.motivos).values(motivos).onConflictDoNothing();

  await db.insert(s.sucursales).values({ nombre: "Sucursal Sendero" }).onConflictDoNothing();
  const [sendero] = await db
    .select({ id: s.sucursales.id })
    .from(s.sucursales)
    .where(eq(sql`lower(${s.sucursales.nombre})`, "sucursal sendero"));

  const passwordHash = await hash(password!);
  const usuarios = [
    { usuario: "admin", nombreCompleto: "Administrador General", rol: "admin" as const, sucursalId: null },
    { usuario: "gerente", nombreCompleto: "Laura Martínez", rol: "gerente" as const, sucursalId: sendero.id },
    { usuario: "encargado", nombreCompleto: "Juan Pérez", rol: "encargado" as const, sucursalId: sendero.id },
    { usuario: "empleado", nombreCompleto: "Ana López", rol: "empleado" as const, sucursalId: sendero.id },
  ];
  await db.insert(s.usuarios).values(usuarios.map((u) => ({ ...u, passwordHash }))).onConflictDoNothing();

  const conteo = await db.execute(sql`
    select (select count(*) from productos) productos, (select count(*) from motivos) motivos,
           (select count(*) from sucursales) sucursales, (select count(*) from usuarios) usuarios`);
  console.log("Carga inicial lista:", conteo[0]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => cliente.end());
