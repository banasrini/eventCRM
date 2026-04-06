import { db } from "@/db";
import { events } from "@/db/schema";
import { UpdateEventSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const [row] = await db.select().from(events).where(eq(events.id, id));
  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = UpdateEventSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(events)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(events.id, id))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await db.delete(events).where(eq(events.id, id));
  return new Response(null, { status: 204 });
}
