import { db } from "@/db";
import { sponsors, eventSponsors, events } from "@/db/schema";
import { UpdateSponsorSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/sponsors/[id]">
) {
  const { id } = await ctx.params;

  const [sponsor] = await db
    .select()
    .from(sponsors)
    .where(eq(sponsors.id, id));

  if (!sponsor) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Get event history for this sponsor
  const history = await db
    .select({
      eventId: events.id,
      eventName: events.name,
      eventDate: events.date,
      eventStatus: events.status,
      tier: eventSponsors.tier,
      contribution: eventSponsors.contribution,
    })
    .from(eventSponsors)
    .innerJoin(events, eq(eventSponsors.eventId, events.id))
    .where(eq(eventSponsors.sponsorId, id))
    .orderBy(events.date);

  return Response.json({ ...sponsor, eventHistory: history });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/sponsors/[id]">
) {
  const { id } = await ctx.params;
  const body = await request.json();
  const parsed = UpdateSponsorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tags, ...rest } = parsed.data;
  const updates: Record<string, unknown> = {
    ...rest,
    updatedAt: new Date().toISOString(),
  };
  if (tags !== undefined) updates.tags = JSON.stringify(tags);

  const [row] = await db
    .update(sponsors)
    .set(updates)
    .where(eq(sponsors.id, id))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: RouteContext<"/api/sponsors/[id]">
) {
  const { id } = await ctx.params;
  await db.delete(sponsors).where(eq(sponsors.id, id));
  return new Response(null, { status: 204 });
}
