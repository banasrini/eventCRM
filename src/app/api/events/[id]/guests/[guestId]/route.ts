import { db } from "@/db";
import { guests } from "@/db/schema";
import { UpdateGuestSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/guests/[guestId]">
) {
  const { guestId } = await ctx.params;
  const body = await request.json();
  const parsed = UpdateGuestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(guests)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(guests.id, guestId))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/events/[id]/guests/[guestId]">
) {
  const { guestId } = await ctx.params;
  await db.delete(guests).where(eq(guests.id, guestId));
  return new Response(null, { status: 204 });
}
