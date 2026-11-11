import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", ["empleado", "encargado", "gerente", "admin"]);
export const unidadEnum = pgEnum("unidad", ["L", "kg", "pz"]);

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });

export const sucursales = pgTable(
  "sucursales",
  {
    id: serial("id").primaryKey(),
    nombre: text("nombre").notNull(),
    activa: boolean("activa").notNull().default(true),
  },
  (t) => [uniqueIndex("sucursales_nombre_unico").on(sql`lower(${t.nombre})`)],
);

export const usuarios = pgTable(
  "usuarios",
  {
    id: serial("id").primaryKey(),
    usuario: text("usuario").notNull().unique(),
    nombreCompleto: text("nombre_completo").notNull(),
    rol: rolEnum("rol").notNull(),
    sucursalId: integer("sucursal_id").references(() => sucursales.id),
    passwordHash: text("password_hash").notNull(),
    activo: boolean("activo").notNull().default(true),
  },
  (t) => [
    check(
      "usuarios_sucursal_por_rol",
      sql`(${t.rol} = 'admin' AND ${t.sucursalId} IS NULL) OR (${t.rol} <> 'admin' AND ${t.sucursalId} IS NOT NULL)`,
    ),
  ],
);

export const sesiones = pgTable("sesiones", {
  tokenHash: text("token_hash").primaryKey(),
  usuarioId: integer("usuario_id")
    .notNull()
    .references(() => usuarios.id, { onDelete: "cascade" }),
  creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
  ultimoAcceso: timestamp("ultimo_acceso", { withTimezone: true }).notNull().defaultNow(),
});

export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  categoria: text("categoria").notNull(),
  nombre: text("nombre").notNull().unique(),
  unidad: unidadEnum("unidad").notNull(),
  costoUnitario: numeric("costo_unitario", { precision: 10, scale: 2 }).notNull(),
  activo: boolean("activo").notNull().default(true),
});

export const motivos = pgTable("motivos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  activo: boolean("activo").notNull().default(true),
});

export const mermas = pgTable(
  "mermas",
  {
    id: serial("id").primaryKey(),
    sucursalId: integer("sucursal_id").notNull().references(() => sucursales.id),
    usuarioId: integer("usuario_id").notNull().references(() => usuarios.id),
    productoId: integer("producto_id").notNull().references(() => productos.id),
    motivoId: integer("motivo_id").notNull().references(() => motivos.id),
    cantidad: numeric("cantidad", { precision: 10, scale: 3 }).notNull(),
    unidad: unidadEnum("unidad").notNull(),
    costoUnitario: numeric("costo_unitario", { precision: 10, scale: 2 }).notNull(),
    costoTotal: numeric("costo_total", { precision: 12, scale: 2 }).notNull(),
    observaciones: text("observaciones"),
    creadaEn: timestamp("creada_en", { withTimezone: true }).notNull().defaultNow(),
    claveEnvio: uuid("clave_envio").notNull().unique(),
    canceladaEn: timestamp("cancelada_en", { withTimezone: true }),
    canceladaPor: integer("cancelada_por").references(() => usuarios.id),
    motivoCancelacion: text("motivo_cancelacion"),
  },
  (t) => [check("mermas_cantidad_positiva", sql`${t.cantidad} > 0`)],
);

export const fotosMerma = pgTable("fotos_merma", {
  mermaId: integer("merma_id")
    .primaryKey()
    .references(() => mermas.id, { onDelete: "cascade" }),
  tipoMime: text("tipo_mime").notNull(),
  bytes: bytea("bytes").notNull(),
});
