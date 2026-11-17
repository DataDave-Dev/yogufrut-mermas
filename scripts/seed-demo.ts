// Datos de demostración para desarrollo: más sucursales, personal y dos meses de mermas.
// Idempotente (generador con semilla fija + claves únicas). No se usa en la base de pruebas E2E.
// Requiere la carga inicial: `pnpm db:seed` antes de `pnpm db:demo`.
// Córrelo con `pnpm dev` detenido: al terminar, SQLite borra los archivos -wal/-shm y un servidor
// encendido se queda escribiendo en archivos borrados (sus escrituras fallan hasta reiniciarlo).
import { hash } from "@node-rs/argon2";
import { createClient } from "@libsql/client";
import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as s from "../src/db/schema";
import { costoTotalCentavos } from "../src/lib/costo";

try { process.loadEnvFile(); } catch {}

const url = process.env.DATABASE_URL;
const password = process.env.SEED_PASSWORD;
if (!url || !password) throw new Error("Faltan DATABASE_URL o SEED_PASSWORD en .env");

const DIAS = 60;
const DIA_MS = 24 * 60 * 60 * 1000;
const HORA_MS = 60 * 60 * 1000;
const LOTE = 200;

const SUCURSALES = [
  "Sucursal Cumbres", "Sucursal Valle", "Sucursal Centro", "Sucursal San Pedro", "Sucursal Apodaca",
  "Sucursal Guadalupe", "Sucursal Escobedo", "Sucursal Santa Catarina", "Sucursal Contry",
];
const SUCURSAL_CERRADA = "Sucursal Contry";
const NOMBRES = [
  "María", "José", "Luis", "Carmen", "Sofía", "Diego", "Valeria", "Miguel", "Fernanda", "Carlos", "Daniela", "Jorge",
  "Paola", "Ricardo", "Andrea", "Héctor", "Mariana", "Raúl", "Gabriela", "Óscar", "Karla", "Iván", "Rosa", "Emilio",
];
const APELLIDOS = [
  "García", "Hernández", "Rodríguez", "González", "Treviño", "Garza", "Cantú", "Salinas", "Villarreal", "Flores",
  "Ramírez", "Torres", "Leal", "Elizondo", "Guerra", "Lozano", "Cavazos", "Sáenz",
];
const PLANTILLA = ["gerente", "encargado", "encargado", "empleado", "empleado", "empleado", "empleado", "empleado"] as const;
const OBSERVACIONES = [
  "Se detectó durante la revisión de apertura.", "Se cayó al acomodar el refrigerador.", "Cliente devolvió el pedido.",
  "Falla del congelador durante la noche.", "Sobrante del cierre.",
];

// Generador determinista (mulberry32): mismas corridas, mismos datos.
let estado = 20261117;
function azar(): number {
  estado = (estado + 0x6d2b79f5) | 0;
  let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entero = (min: number, max: number) => min + Math.floor(azar() * (max - min + 1));
const elegir = <T,>(lista: readonly T[]): T => lista[Math.floor(azar() * lista.length)];
// Sesgo hacia los primeros elementos, para que los rankings tengan forma.
const elegirSesgado = <T,>(lista: readonly T[]): T => lista[Math.floor(azar() ** 2 * lista.length)];
const sinAcentos = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const cliente = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(cliente, { schema: s });

async function main() {
  const [productos, motivos] = await Promise.all([
    db.select().from(s.productos).where(eq(s.productos.activo, true)).orderBy(asc(s.productos.id)),
    db.select().from(s.motivos).where(eq(s.motivos.activo, true)).orderBy(asc(s.motivos.id)),
  ]);
  if (productos.length === 0 || motivos.length === 0) throw new Error("Corre primero `pnpm db:seed` (faltan catálogos).");

  await db.insert(s.sucursales).values(SUCURSALES.map((nombre) => ({ nombre, activa: nombre !== SUCURSAL_CERRADA }))).onConflictDoNothing();
  const sucursales = await db.select().from(s.sucursales).orderBy(asc(s.sucursales.id));

  // Personal: una plantilla por sucursal nueva; alrededor de 1 de cada 12 queda inactivo.
  const passwordHash = await hash(password!);
  const usados = new Set<string>();
  const personal = sucursales
    .filter((suc) => SUCURSALES.includes(suc.nombre))
    .flatMap((suc) =>
      PLANTILLA.map((rol) => {
        const nombre = elegir(NOMBRES);
        const apellido = elegir(APELLIDOS);
        const base = sinAcentos(`${nombre}.${apellido}`);
        let usuario = base;
        for (let n = 2; usados.has(usuario); n++) usuario = `${base}${n}`;
        usados.add(usuario);
        return { usuario, nombreCompleto: `${nombre} ${apellido}`, rol, sucursalId: suc.id, passwordHash, activo: rol === "gerente" || azar() > 1 / 12 };
      }),
    );
  await db.insert(s.usuarios).values(personal).onConflictDoNothing();
  const usuarios = await db.select().from(s.usuarios);

  // Mermas: de 2 a 6 por sucursal y día, entre 9:00 y 21:00 hora de Monterrey (UTC−6).
  const ahora = Date.now();
  const hoyUtc = Math.floor(ahora / DIA_MS) * DIA_MS;
  const mermas: (typeof s.mermas.$inferInsert)[] = [];
  for (const suc of sucursales) {
    const equipo = usuarios.filter((u) => u.sucursalId === suc.id);
    const gerente = equipo.find((u) => u.rol === "gerente");
    if (equipo.length === 0) continue;
    for (let dia = 0; dia < DIAS; dia++) {
      const cuantas = entero(2, 6);
      for (let i = 0; i < cuantas; i++) {
        const creada = hoyUtc - dia * DIA_MS + 15 * HORA_MS + Math.floor(azar() * 12 * HORA_MS);
        const producto = elegirSesgado(productos);
        const cantidadMilesimas = producto.unidad === "pz" ? entero(1, 12) * 1000 : entero(1, 20) * 250;
        const cancelada = Boolean(gerente) && azar() < 0.05;
        const observaciones = azar() < 0.25 ? elegir(OBSERVACIONES) : null;
        const motivo = elegirSesgado(motivos);
        const autor = elegir(equipo);
        if (creada > ahora) continue;
        mermas.push({
          sucursalId: suc.id,
          usuarioId: autor.id,
          productoId: producto.id,
          motivoId: motivo.id,
          cantidadMilesimas,
          unidad: producto.unidad,
          costoUnitarioCentavos: producto.costoUnitarioCentavos,
          costoTotalCentavos: costoTotalCentavos(producto.costoUnitarioCentavos, cantidadMilesimas),
          observaciones,
          creadaEn: new Date(creada),
          claveEnvio: `demo-${suc.id}-${dia}-${i}`,
          canceladaEn: cancelada ? new Date(Math.min(creada + HORA_MS, ahora)) : null,
          canceladaPor: cancelada ? gerente!.id : null,
          motivoCancelacion: cancelada ? "Registro duplicado" : null,
        });
      }
    }
  }
  for (let i = 0; i < mermas.length; i += LOTE) {
    await db.insert(s.mermas).values(mermas.slice(i, i + LOTE)).onConflictDoNothing();
  }

  const [nSucursales, nUsuarios, nMermas] = await Promise.all([db.$count(s.sucursales), db.$count(s.usuarios), db.$count(s.mermas)]);
  console.log("Datos de demostración listos:", { sucursales: nSucursales, usuarios: nUsuarios, mermas: nMermas });
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => cliente.close());
