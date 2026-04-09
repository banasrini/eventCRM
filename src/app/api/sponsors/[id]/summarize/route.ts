import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { sponsors, eventSponsors, events } from "@/db/schema";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, id));
  if (!sponsor) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const history = await db
    .select({
      eventName: events.name,
      eventDate: events.date,
      eventStatus: events.status,
      tier: eventSponsors.tier,
      contribution: eventSponsors.contribution,
      notes: eventSponsors.notes,
    })
    .from(eventSponsors)
    .innerJoin(events, eq(eventSponsors.eventId, events.id))
    .where(eq(eventSponsors.sponsorId, id))
    .orderBy(events.date);

  const lines: string[] = [
    `Company: ${sponsor.companyName}`,
    sponsor.targetCustomerRevenue ? `Target customer revenue: ${sponsor.targetCustomerRevenue}` : null,
    sponsor.notes ? `Sponsor notes: ${sponsor.notes}` : null,
    "",
    `Event history (${history.length} event${history.length !== 1 ? "s" : ""}):`,
    ...history.map((h, i) => {
      const parts = [
        `${i + 1}. ${h.eventName}`,
        h.eventDate ? `(${h.eventDate})` : null,
        h.tier ? `tier: ${h.tier}` : null,
        h.contribution != null ? `contribution: $${h.contribution.toLocaleString()}` : null,
        h.notes ? `notes: "${h.notes}"` : null,
      ].filter(Boolean);
      return parts.join(" — ");
    }),
  ].filter((l): l is string => l !== null);

  const prompt = `You are a CRM assistant. Based on the following sponsor data, write a concise relationship history summary (3–5 sentences). Capture key details: how long we've worked with them, their sponsorship pattern, any notable notes, and their target customer profile if known. Be factual and specific.\n\n${lines.join("\n")}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const summary = response.content[0].type === "text" ? response.content[0].text : "";

  await db
    .update(sponsors)
    .set({ aiSummary: summary, updatedAt: new Date().toISOString() })
    .where(eq(sponsors.id, id));

  return Response.json({ summary });
}
