import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/db";
import { sponsors, eventSponsors, events, sponsorNotes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

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

  const [notes, history] = await Promise.all([
    db
      .select()
      .from(sponsorNotes)
      .where(eq(sponsorNotes.sponsorId, id))
      .orderBy(desc(sponsorNotes.createdAt)),
    db
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
      .orderBy(events.date),
  ]);

  const contextLines: string[] = [
    `Company: ${sponsor.companyName}`,
    sponsor.targetCustomerRevenue ? `Target customer revenue: ${sponsor.targetCustomerRevenue}` : null,
    sponsor.notes ? `General notes: ${sponsor.notes}` : null,
    "",
    notes.length > 0
      ? `Context log (${notes.length} entries):\n${notes.map((n, i) =>
          `${i + 1}. [${n.source ?? "note"} — ${n.createdAt?.slice(0, 10)}] ${n.content}`
        ).join("\n")}`
      : "No context log entries.",
    "",
    history.length > 0
      ? `Event history (${history.length} events):\n${history.map((h, i) => {
          const parts = [
            `${i + 1}. ${h.eventName}`,
            h.eventDate ? `(${h.eventDate})` : null,
            h.tier ? `tier: ${h.tier}` : null,
            h.contribution != null ? `contribution: $${h.contribution.toLocaleString()}` : null,
            h.notes ? `notes: "${h.notes}"` : null,
          ].filter(Boolean);
          return parts.join(" — ");
        }).join("\n")}`
      : "No event history.",
  ].filter((l): l is string => l !== null);

  const prompt = `You are a CRM relationship intelligence assistant. Based on the sponsor data below, produce a structured relationship brief in JSON with exactly these keys:

- "relationshipStatus": 1–2 sentences on the current state of the relationship and how long it has been active.
- "whatTheyCareAbout": bullet points (as a single string, use "• " prefix) on what this sponsor prioritises — their goals, audience, or product focus.
- "personalDetails": any personal or memorable details about contacts worth knowing (e.g. names, preferences, communication style). If none, say "None noted."
- "openActionItems": bullet points (as a single string, use "• " prefix) on outstanding follow-ups or next steps. If none, say "None identified."
- "sentiment": one word — "positive", "neutral", or "negative" — reflecting the overall relationship tone.

Return ONLY valid JSON, no markdown fences.

Sponsor data:
${contextLines.join("\n")}`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text.trim() : "{}";

  let brief: Record<string, string>;
  try {
    brief = JSON.parse(raw);
  } catch {
    brief = { relationshipStatus: raw, whatTheyCareAbout: "", personalDetails: "", openActionItems: "", sentiment: "neutral" };
  }

  const now = new Date().toISOString();
  await db
    .update(sponsors)
    .set({ aiSummary: JSON.stringify(brief), aiSummaryAt: now, updatedAt: now })
    .where(eq(sponsors.id, id));

  return Response.json({ brief, generatedAt: now });
}
