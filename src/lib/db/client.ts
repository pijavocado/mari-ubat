import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/clinic-group-buy.db";
export const client = createClient({ url: databaseUrl });

export const db = drizzle(client, { schema });
