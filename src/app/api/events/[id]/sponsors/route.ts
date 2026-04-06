import { db } from "@/db";
import { eventSponsors, sponsors } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { AttachSponsorSchema, UpdateEventSponsorSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/events/[id]/sponsors">
) {
  const { id: eventId } = await ctx.params;

  const rows = await db
    .select({
      id: eventSponsors.id,
      eventId: eventSponsors.eventId,
      sponsorId: eventSponsors.sponsorId,
      tier: eventSponsors.tier,
      contribution: eventSponsors.contribution,
      notes: eventSponsors.notes,
      createdAt: eventSponsors.createdAt,
      companyName: sponsors.companyName,
      contactName: sponsors.contactName,
      email: sponsors.email,
    })
    .from(eventSponsors)
    .innerJoin(sponsors, eq(eventSponsors.sponsorId, sponsors.id))
    .where(eq(eventSponsors.eventId, eventId));

  return Response.json(rows);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/sponsors">
) {
  const { id: eventId } = await ctx.params;
  const body = await request.json();
  const parsed = AttachSponsorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { sponsorId, ...rest } = parsed.data;

  // Upsert — if already attached, update instead
  const existing = await db
    .select()
    .from(eventSponsors)
    .where(and(eq(eventSponsors.eventId, eventId), eq(eventSponsors.sponsorId, sponsorId)))
    .limit(1);

  if (existing.length > 0) {
    const [row] = await db
      .update(eventSponsors)
      .set(rest)
      .where(eq(eventSponsors.id, existing[0].id))
      .returning();
    return Response.json(row);
  }

  const [row] = await db
    .insert(eventSponsors)
    .values({ id: generateId(), eventId, sponsorId, ...rest })
    .returning();

  return Response.json(row, { status: 201 });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/sponsors">
) {
  const { id: eventId } = await ctx.params;
  const url = new URL(request.url);
  const sponsorId = url.searchParams.get("sponsorId");
  if (!sponsorId) return Response.json({ error: "sponsorId required" }, { status: 400 });

  const body = await request.json();
  const parsed = UpdateEventSponsorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(eventSponsors)
    .set(parsed.data)
    .where(and(eq(eventSponsors.eventId, eventId), eq(eventSponsors.sponsorId, sponsorId)))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/sponsors">
) {
  const { id: eventId } = await ctx.params;
  const url = new URL(request.url);
  const sponsorId = url.searchParams.get("sponsorId");
  if (!sponsorId) return Response.json({ error: "sponsorId required" }, { status: 400 });

  await db
    .delete(eventSponsors)
    .where(and(eq(eventSponsors.eventId, eventId), eq(eventSponsors.sponsorId, sponsorId)));

  return new Response(null, { status: 204 });
}
