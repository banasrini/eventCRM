export const dynamic = "force-dynamic";

export async function GET() {
  const errors: string[] = [];

  // Test 1: env vars
  const dbUrl = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  errors.push(`DB URL: ${dbUrl ? dbUrl.slice(0, 40) : "MISSING"}`);
  errors.push(`Token: ${token ? "present (" + token.length + " chars)" : "MISSING"}`);

  // Test 2: raw fetch to Turso
  try {
    const res = await fetch(`${dbUrl}/v2/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ requests: [{ type: "execute", stmt: { sql: "SELECT 1 as ok" } }] }),
    });
    const data = await res.json();
    errors.push(`Turso raw fetch: ${res.status} - ${JSON.stringify(data).slice(0, 100)}`);
  } catch (e) {
    errors.push(`Turso raw fetch error: ${String(e)}`);
  }

  // Test 3: drizzle client with select
  try {
    const { db } = await import("@/db");
    const { sql } = await import("drizzle-orm");
    const result = await db.run(sql`SELECT 1 as ok`);
    errors.push(`Drizzle: ok - ${JSON.stringify(result).slice(0, 100)}`);
  } catch (e) {
    errors.push(`Drizzle error: ${String(e)}`);
  }

  return Response.json({ checks: errors });
}
