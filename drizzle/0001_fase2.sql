CREATE TABLE "intentos_login" (
	"usuario" text PRIMARY KEY NOT NULL,
	"fallidos" integer DEFAULT 0 NOT NULL,
	"ultimo_fallo" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "mermas_usuario_fecha" ON "mermas" USING btree ("usuario_id","creada_en");--> statement-breakpoint
CREATE INDEX "mermas_sucursal_fecha" ON "mermas" USING btree ("sucursal_id","creada_en");