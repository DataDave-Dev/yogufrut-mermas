import "server-only";
import { createClient, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

const globalParaDb = globalThis as unknown as { cliente?: Client };

function crearCliente(): Client {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Falta DATABASE_URL (por ejemplo file:./data/mermas.db)");
  // timeout: espera hasta 5 s si otra conexión tiene el archivo bloqueado (por defecto falla al instante).
  // libsql ya activa las llaves foráneas en cada conexión; el modo WAL lo deja fijado `pnpm db:seed`.
  return createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN, timeout: 5000 });
}

// Reutiliza la conexión entre recargas en desarrollo.
const cliente = globalParaDb.cliente ?? crearCliente();
if (process.env.NODE_ENV !== "production") globalParaDb.cliente = cliente;

export const db = drizzle(cliente, { schema });
