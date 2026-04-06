import { db } from "@/db";
import { sponsors, events, eventSponsors, guests } from "@/db/schema";
import { eq, count, sum, desc } from "drizzle-orm";

export async function GET() {
  const [sponsorCount] = await db.select({ count: count() }).from(sponsors);
  const [eventCount] = await db.select({ count: count() }).from(events);
  const [guestCount] = await db
    .select({ count: count() })
    .from(guests)
    .where(eq(guests.rsvpStatus, "confirmed"));

  const [totalContributions] = await db
    .select({ total: sum(eventSponsors.contribution) })
    .from(eventSponsors);

  // Top sponsors by total contributions
  const topSponsors = await db
    .select({
      sponsorId: eventSponsors.sponsorId,
      companyName: sponsors.companyName,
      totalContribution: sum(eventSponsors.contribution),
      eventCount: count(eventSponsors.eventId),
    })
    .from(eventSponsors)
    .innerJoin(sponsors, eq(eventSponsors.sponsorId, sponsors.id))
    .groupBy(eventSponsors.sponsorId, sponsors.companyName)
    .orderBy(desc(sum(eventSponsors.contribution)))
    .limit(5);

  // Recent events
  const recentEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(5);

  return Response.json({
    sponsorCount: sponsorCount.count,
    eventCount: eventCount.count,
    confirmedGuestCount: guestCount.count,
    totalContributions: totalContributions.total ?? 0,
    topSponsors,
    recentEvents,
  });
}
