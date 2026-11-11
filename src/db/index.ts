import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalParaDb = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

// Reutiliza la conexión entre recargas en desarrollo.
const cliente = globalParaDb.sql ?? postgres(process.env.DATABASE_URL!, { max: 10 });
if (process.env.NODE_ENV !== "production") globalParaDb.sql = cliente;

export const db = drizzle(cliente, { schema });
