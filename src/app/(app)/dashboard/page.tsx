import Link from "next/link";
import { db } from "@/db";
import { sponsors, events, eventSponsors, guests } from "@/db/schema";
import { eq, count, sum, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate, STATUS_COLORS } from "@/lib/utils";
import { Users, CalendarDays, DollarSign, UserCheck } from "lucide-react";

async function getStats() {
  const [sponsorCount] = await db.select({ count: count() }).from(sponsors);
  const [eventCount] = await db.select({ count: count() }).from(events);
  const [guestCount] = await db
    .select({ count: count() })
    .from(guests)
    .where(eq(guests.rsvpStatus, "confirmed"));
  const [contributions] = await db
    .select({ total: sum(eventSponsors.contribution) })
    .from(eventSponsors);

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

  const recentEvents = await db
    .select()
    .from(events)
    .orderBy(desc(events.createdAt))
    .limit(5);

  return { sponsorCount: sponsorCount.count, eventCount: eventCount.count, confirmedGuests: guestCount.count, totalContributions: contributions.total ?? 0, topSponsors, recentEvents };
}

export default async function DashboardPage() {
  const { sponsorCount, eventCount, confirmedGuests, totalContributions, topSponsors, recentEvents } = await getStats();

  const stats = [
    { label: "Total Sponsors", value: sponsorCount, icon: Users },
    { label: "Total Events", value: eventCount, icon: CalendarDays },
    { label: "Confirmed Guests", value: confirmedGuests, icon: UserCheck },
    { label: "Total Contributions", value: formatCurrency(Number(totalContributions)), icon: DollarSign },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="rounded-full bg-orange-50 p-2">
                <Icon className="h-4 w-4 text-[#E73D00]" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Sponsors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top Sponsors by Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            {topSponsors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sponsor data yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sponsor</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topSponsors.map((s) => (
                    <TableRow key={s.sponsorId}>
                      <TableCell>
                        <Link href={`/sponsors/${s.sponsorId}`} className="font-medium hover:underline">
                          {s.companyName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.eventCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(s.totalContribution))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Recent Events</CardTitle>
          </CardHeader>
          <CardContent>
            {recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events yet.</p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((e) => (
                  <Link
                    key={e.id}
                    href={`/events/${e.id}`}
                    className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(e.date)}</p>
                    </div>
                    <Badge className={STATUS_COLORS[e.status ?? "planning"]}>
                      {e.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
