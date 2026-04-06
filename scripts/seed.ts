import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema";
import { customAlphabet } from "nanoid";

const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 12);

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function main() {
  console.log("Seeding database...");
  const now = new Date().toISOString();

  // Sponsors
  const s1 = nanoid(), s2 = nanoid(), s3 = nanoid();
  await db.insert(schema.sponsors).values([
    { id: s1, companyName: "Nike", contactName: "Alex Johnson", email: "alex@nike.com", url: "https://nike.com", city: "Beaverton", state: "OR", country: "US", tags: JSON.stringify(["athletics", "apparel"]), createdAt: now, updatedAt: now },
    { id: s2, companyName: "Acme Corp", contactName: "Sam Lee", email: "sam@acme.com", url: "https://acme.com", city: "Los Angeles", state: "CA", country: "US", tags: JSON.stringify(["tech"]), createdAt: now, updatedAt: now },
    { id: s3, companyName: "TechStart Inc", contactName: "Morgan Chen", email: "morgan@techstart.io", city: "Austin", state: "TX", country: "US", notes: "First-time sponsor", createdAt: now, updatedAt: now },
  ]).onConflictDoNothing();

  // Events
  const e1 = nanoid(), e2 = nanoid();
  await db.insert(schema.events).values([
    { id: e1, name: "LA Summit 2025", date: "2025-09-15", venue: "Convention Center", city: "Los Angeles", state: "CA", country: "US", status: "planning", createdAt: now, updatedAt: now },
    { id: e2, name: "Tech Gala NYC", date: "2025-11-20", venue: "Grand Ballroom", city: "New York", state: "NY", country: "US", status: "planning", createdAt: now, updatedAt: now },
  ]).onConflictDoNothing();

  // Event sponsors
  await db.insert(schema.eventSponsors).values([
    { id: nanoid(), eventId: e1, sponsorId: s1, tier: "gold", contribution: 50000, createdAt: now },
    { id: nanoid(), eventId: e1, sponsorId: s2, tier: "silver", contribution: 20000, createdAt: now },
    { id: nanoid(), eventId: e2, sponsorId: s1, tier: "gold", contribution: 75000, createdAt: now },
    { id: nanoid(), eventId: e2, sponsorId: s3, tier: "bronze", contribution: 5000, createdAt: now },
  ]).onConflictDoNothing();

  // Guests
  await db.insert(schema.guests).values([
    { id: nanoid(), eventId: e1, name: "John Smith", email: "john@example.com", rsvpStatus: "confirmed", role: "attendee", createdAt: now, updatedAt: now },
    { id: nanoid(), eventId: e1, name: "Alex Johnson", email: "alex@nike.com", rsvpStatus: "confirmed", role: "sponsor", sponsorId: s1, createdAt: now, updatedAt: now },
    { id: nanoid(), eventId: e1, name: "Jane Doe", email: "jane@example.com", rsvpStatus: "pending", role: "speaker", createdAt: now, updatedAt: now },
  ]).onConflictDoNothing();

  // Tasks
  await db.insert(schema.tasks).values([
    { id: nanoid(), eventId: e1, title: "Book venue", status: "done", assignedTo: "Sarah", createdAt: now, updatedAt: now },
    { id: nanoid(), eventId: e1, title: "Send sponsor invoices", status: "in_progress", assignedTo: "Mike", dueDate: "2025-07-01", createdAt: now, updatedAt: now },
    { id: nanoid(), eventId: e1, title: "Design event program", status: "todo", dueDate: "2025-08-01", createdAt: now, updatedAt: now },
  ]).onConflictDoNothing();

  // Budget
  await db.insert(schema.budgetCategories).values([
    { id: nanoid(), eventId: e1, name: "Catering", plannedAmount: 15000, actualAmount: 12500, createdAt: now, updatedAt: now },
    { id: nanoid(), eventId: e1, name: "AV & Production", plannedAmount: 8000, actualAmount: 0, createdAt: now, updatedAt: now },
    { id: nanoid(), eventId: e1, name: "Marketing", plannedAmount: 5000, actualAmount: 4200, createdAt: now, updatedAt: now },
  ]).onConflictDoNothing();

  console.log("✓ Seed complete");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
