import { db } from "@/db";
import { guests } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { CreateGuestSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await ctx.params;
  const rows = await db.select().from(guests).where(eq(guests.eventId, eventId));
  return Response.json(rows);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await ctx.params;
  const body = await request.json();
  const parsed = CreateGuestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const [row] = await db
    .insert(guests)
    .values({ id: generateId(), eventId, ...parsed.data, createdAt: now, updatedAt: now })
    .returning();

  return Response.json(row, { status: 201 });
}
