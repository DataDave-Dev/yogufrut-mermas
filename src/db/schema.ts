import { sql } from "drizzle-orm";
import { blob, check, index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { ROLES } from "../lib/auth-tipos";

// Montos como enteros (SQLite no tiene decimal exacto): costos en centavos, cantidades en milésimas.
// Fechas en milisegundos UTC; se muestran en America/Monterrey.

export const UNIDADES = ["L", "kg", "pz"] as const;

const ahora = () => new Date();
const fecha = (nombre: string) => integer(nombre, { mode: "timestamp_ms" });
// Literales en el DDL (CHECK no admite parámetros). Los valores son constantes del código.
const enLista = (columna: unknown, valores: readonly string[]) =>
  sql`${columna} in (${sql.raw(valores.map((v) => `'${v.replaceAll("'", "''")}'`).join(", "))})`;

export const sucursales = sqliteTable(
  "sucursales",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    activa: integer("activa", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [uniqueIndex("sucursales_nombre_unico").on(sql`lower(${t.nombre})`)],
);

export const usuarios = sqliteTable(
  "usuarios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    usuario: text("usuario").notNull().unique(),
    nombreCompleto: text("nombre_completo").notNull(),
    rol: text("rol", { enum: ROLES }).notNull(),
    sucursalId: integer("sucursal_id").references(() => sucursales.id),
    passwordHash: text("password_hash").notNull(),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [
    check("usuarios_rol_valido", enLista(t.rol, ROLES)),
    check(
      "usuarios_sucursal_por_rol",
      sql`(${t.rol} = 'admin' AND ${t.sucursalId} IS NULL) OR (${t.rol} <> 'admin' AND ${t.sucursalId} IS NOT NULL)`,
    ),
  ],
);

export const sesiones = sqliteTable("sesiones", {
  tokenHash: text("token_hash").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  creadaEn: fecha("creada_en").notNull().$defaultFn(ahora),
  ultimoAcceso: fecha("ultimo_acceso").notNull().$defaultFn(ahora),
});

export const productos = sqliteTable(
  "productos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    categoria: text("categoria").notNull(),
    nombre: text("nombre").notNull().unique(),
    unidad: text("unidad", { enum: UNIDADES }).notNull(),
    costoUnitarioCentavos: integer("costo_unitario_centavos").notNull(),
    activo: integer("activo", { mode: "boolean" }).notNull().default(true),
  },
  (t) => [
    check("productos_unidad_valida", enLista(t.unidad, UNIDADES)),
    check("productos_costo_no_negativo", sql`${t.costoUnitarioCentavos} >= 0`),
  ],
);

export const motivos = sqliteTable("motivos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  nombre: text("nombre").notNull().unique(),
  activo: integer("activo", { mode: "boolean" }).notNull().default(true),
});

export const mermas = sqliteTable(
  "mermas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    sucursalId: integer("sucursal_id")
      .notNull()
      .references(() => sucursales.id),
    usuarioId: integer("usuario_id")
      .notNull()
      .references(() => usuarios.id),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id),
    motivoId: integer("motivo_id")
      .notNull()
      .references(() => motivos.id),
    cantidadMilesimas: integer("cantidad_milesimas").notNull(),
    unidad: text("unidad", { enum: UNIDADES }).notNull(),
    costoUnitarioCentavos: integer("costo_unitario_centavos").notNull(),
    costoTotalCentavos: integer("costo_total_centavos").notNull(),
    observaciones: text("observaciones"),
    creadaEn: fecha("creada_en").notNull().$defaultFn(ahora),
    claveEnvio: text("clave_envio").notNull().unique(),
    canceladaEn: fecha("cancelada_en"),
    canceladaPor: integer("cancelada_por").references(() => usuarios.id),
    motivoCancelacion: text("motivo_cancelacion"),
  },
  (t) => [
    check("mermas_cantidad_positiva", sql`${t.cantidadMilesimas} > 0`),
    index("mermas_usuario_fecha").on(t.usuarioId, t.creadaEn),
    index("mermas_sucursal_fecha").on(t.sucursalId, t.creadaEn),
  ],
);

export const fotosMerma = sqliteTable("fotos_merma", {
  mermaId: integer("merma_id")
    .primaryKey()
    .references(() => mermas.id, { onDelete: "cascade" }),
  tipoMime: text("tipo_mime").notNull(),
  bytes: blob("bytes", { mode: "buffer" }).notNull(),
});

/** Intentos fallidos de login por nombre de usuario escrito (exista o no), para frenar fuerza bruta. */
export const intentosLogin = sqliteTable("intentos_login", {
  usuario: text("usuario").primaryKey(),
  fallidos: integer("fallidos").notNull().default(0),
  ultimoFallo: fecha("ultimo_fallo").notNull().$defaultFn(ahora),
});
