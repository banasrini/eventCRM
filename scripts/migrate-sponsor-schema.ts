import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("Dropping tier column from sponsors...");
  await client.execute("ALTER TABLE sponsors DROP COLUMN tier");

  console.log("Adding url column to sponsors...");
  await client.execute("ALTER TABLE sponsors ADD COLUMN url TEXT");

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
