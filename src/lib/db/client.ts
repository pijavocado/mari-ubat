import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema.ts";

const databaseUrl = process.env.DATABASE_URL ?? "file:./data/clinic-group-buy.db";
// Only remote libsql:// connections (Turso) need an auth token — the local
// file:// database used in dev doesn't.
export const client = createClient({
  url: databaseUrl,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
