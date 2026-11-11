CREATE TABLE `fotos_merma` (
	`merma_id` integer PRIMARY KEY NOT NULL,
	`tipo_mime` text NOT NULL,
	`bytes` blob NOT NULL,
	FOREIGN KEY (`merma_id`) REFERENCES `mermas`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `intentos_login` (
	`usuario` text PRIMARY KEY NOT NULL,
	`fallidos` integer DEFAULT 0 NOT NULL,
	`ultimo_fallo` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mermas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`sucursal_id` integer NOT NULL,
	`usuario_id` integer NOT NULL,
	`producto_id` integer NOT NULL,
	`motivo_id` integer NOT NULL,
	`cantidad_milesimas` integer NOT NULL,
	`unidad` text NOT NULL,
	`costo_unitario_centavos` integer NOT NULL,
	`costo_total_centavos` integer NOT NULL,
	`observaciones` text,
	`creada_en` integer NOT NULL,
	`clave_envio` text NOT NULL,
	`cancelada_en` integer,
	`cancelada_por` integer,
	`motivo_cancelacion` text,
	FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`motivo_id`) REFERENCES `motivos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`cancelada_por`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "mermas_cantidad_positiva" CHECK("mermas"."cantidad_milesimas" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mermas_clave_envio_unique` ON `mermas` (`clave_envio`);--> statement-breakpoint
CREATE INDEX `mermas_usuario_fecha` ON `mermas` (`usuario_id`,`creada_en`);--> statement-breakpoint
CREATE INDEX `mermas_sucursal_fecha` ON `mermas` (`sucursal_id`,`creada_en`);--> statement-breakpoint
CREATE TABLE `motivos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `motivos_nombre_unique` ON `motivos` (`nombre`);--> statement-breakpoint
CREATE TABLE `productos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`categoria` text NOT NULL,
	`nombre` text NOT NULL,
	`unidad` text NOT NULL,
	`costo_unitario_centavos` integer NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	CONSTRAINT "productos_unidad_valida" CHECK("productos"."unidad" in ('L', 'kg', 'pz')),
	CONSTRAINT "productos_costo_no_negativo" CHECK("productos"."costo_unitario_centavos" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `productos_nombre_unique` ON `productos` (`nombre`);--> statement-breakpoint
CREATE TABLE `sesiones` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`usuario_id` integer NOT NULL,
	`creada_en` integer NOT NULL,
	`ultimo_acceso` integer NOT NULL,
	FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sucursales` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`activa` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sucursales_nombre_unico` ON `sucursales` (lower("nombre"));--> statement-breakpoint
CREATE TABLE `usuarios` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`usuario` text NOT NULL,
	`nombre_completo` text NOT NULL,
	`rol` text NOT NULL,
	`sucursal_id` integer,
	`password_hash` text NOT NULL,
	`activo` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`sucursal_id`) REFERENCES `sucursales`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "usuarios_rol_valido" CHECK("usuarios"."rol" in ('empleado', 'encargado', 'gerente', 'admin')),
	CONSTRAINT "usuarios_sucursal_por_rol" CHECK(("usuarios"."rol" = 'admin' AND "usuarios"."sucursal_id" IS NULL) OR ("usuarios"."rol" <> 'admin' AND "usuarios"."sucursal_id" IS NOT NULL))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `usuarios_usuario_unique` ON `usuarios` (`usuario`);