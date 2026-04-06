import { createClient } from "@libsql/client/http";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Use the HTTP client to avoid native binary issues in serverless environments.
// Convert libsql:// URLs to https:// for the HTTP client.
const rawUrl = process.env.TURSO_DATABASE_URL!;
const url = rawUrl.startsWith("libsql://") ? rawUrl.replace("libsql://", "https://") : rawUrl;

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
