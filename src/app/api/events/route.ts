import { db } from "@/db";
import { events } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { CreateEventSchema } from "@/lib/validations";
import { like, eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  const conditions = [];
  if (search) conditions.push(like(events.name, `%${search}%`));
  if (status) conditions.push(eq(events.status, status as "planning" | "active" | "completed"));

  const rows = await db
    .select()
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(events.date);

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const id = generateId();
  const now = new Date().toISOString();

  const [row] = await db
    .insert(events)
    .values({ id, ...parsed.data, createdAt: now, updatedAt: now })
    .returning();

  return Response.json(row, { status: 201 });
}
