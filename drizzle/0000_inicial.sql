CREATE TYPE "public"."rol" AS ENUM('empleado', 'encargado', 'gerente', 'admin');--> statement-breakpoint
CREATE TYPE "public"."unidad" AS ENUM('L', 'kg', 'pz');--> statement-breakpoint
CREATE TABLE "fotos_merma" (
	"merma_id" integer PRIMARY KEY NOT NULL,
	"tipo_mime" text NOT NULL,
	"bytes" "bytea" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mermas" (
	"id" serial PRIMARY KEY NOT NULL,
	"sucursal_id" integer NOT NULL,
	"usuario_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"motivo_id" integer NOT NULL,
	"cantidad" numeric(10, 3) NOT NULL,
	"unidad" "unidad" NOT NULL,
	"costo_unitario" numeric(10, 2) NOT NULL,
	"costo_total" numeric(12, 2) NOT NULL,
	"observaciones" text,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"clave_envio" uuid NOT NULL,
	"cancelada_en" timestamp with time zone,
	"cancelada_por" integer,
	"motivo_cancelacion" text,
	CONSTRAINT "mermas_clave_envio_unique" UNIQUE("clave_envio"),
	CONSTRAINT "mermas_cantidad_positiva" CHECK ("mermas"."cantidad" > 0)
);
--> statement-breakpoint
CREATE TABLE "motivos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "motivos_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoria" text NOT NULL,
	"nombre" text NOT NULL,
	"unidad" "unidad" NOT NULL,
	"costo_unitario" numeric(10, 2) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "productos_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "sesiones" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"usuario_id" integer NOT NULL,
	"creada_en" timestamp with time zone DEFAULT now() NOT NULL,
	"ultimo_acceso" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sucursales" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"activa" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usuarios" (
	"id" serial PRIMARY KEY NOT NULL,
	"usuario" text NOT NULL,
	"nombre_completo" text NOT NULL,
	"rol" "rol" NOT NULL,
	"sucursal_id" integer,
	"password_hash" text NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "usuarios_usuario_unique" UNIQUE("usuario"),
	CONSTRAINT "usuarios_sucursal_por_rol" CHECK (("usuarios"."rol" = 'admin' AND "usuarios"."sucursal_id" IS NULL) OR ("usuarios"."rol" <> 'admin' AND "usuarios"."sucursal_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "fotos_merma" ADD CONSTRAINT "fotos_merma_merma_id_mermas_id_fk" FOREIGN KEY ("merma_id") REFERENCES "public"."mermas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_motivo_id_motivos_id_fk" FOREIGN KEY ("motivo_id") REFERENCES "public"."motivos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mermas" ADD CONSTRAINT "mermas_cancelada_por_usuarios_id_fk" FOREIGN KEY ("cancelada_por") REFERENCES "public"."usuarios"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_usuario_id_usuarios_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_sucursal_id_sucursales_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."sucursales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sucursales_nombre_unico" ON "sucursales" USING btree (lower("nombre"));