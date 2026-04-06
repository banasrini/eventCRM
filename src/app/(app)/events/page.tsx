export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/db";
import { events, eventSponsors, guests } from "@/db/schema";
import { like, eq, and, count } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_COLORS, formatDate } from "@/lib/utils";
import { Plus, CalendarDays, Users, DollarSign } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ search?: string; status?: string }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { search, status } = await searchParams;

  const conditions = [];
  if (search) conditions.push(like(events.name, `%${search}%`));
  if (status && status !== "all")
    conditions.push(eq(events.status, status as "planning" | "active" | "completed"));

  const rows = await db
    .select()
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(events.date);

  // Get counts for each event
  const sponsorCounts = await db
    .select({ eventId: eventSponsors.eventId, count: count() })
    .from(eventSponsors)
    .groupBy(eventSponsors.eventId);

  const guestCounts = await db
    .select({ eventId: guests.eventId, count: count() })
    .from(guests)
    .groupBy(guests.eventId);

  const sponsorMap = Object.fromEntries(sponsorCounts.map((s) => [s.eventId, s.count]));
  const guestMap = Object.fromEntries(guestCounts.map((g) => [g.eventId, g.count]));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
        <Button render={<Link href="/events/new" />}>
          <Plus className="mr-1 h-4 w-4" /> New Event
        </Button>
      </div>

      {/* Filter bar */}
      <div className="flex gap-2">
        {["all", "planning", "active", "completed"].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/events" : `/events?status=${s}`}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              (s === "all" && !status) || status === s
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>No events found.</p>
          <Button variant="outline" className="mt-4" render={<Link href="/events/new" />}>
            Create your first event
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((e) => (
            <Link key={e.id} href={`/events/${e.id}`}>
              <Card className="hover:bg-muted/40 transition-colors cursor-pointer">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-tight">{e.name}</h3>
                    <Badge className={`shrink-0 ${STATUS_COLORS[e.status ?? "planning"]}`}>
                      {e.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {formatDate(e.date)}
                    {e.venue && <span>· {e.venue}</span>}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {sponsorMap[e.id] ?? 0} sponsors
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {guestMap[e.id] ?? 0} guests
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
