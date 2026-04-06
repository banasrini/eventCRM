export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { events, eventSponsors, guests, tasks, budgetCategories, sponsors } from "@/db/schema";
import { eq, count, sum } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { STATUS_COLORS, formatDate, formatCurrency } from "@/lib/utils";
import { Pencil, ArrowLeft, Users, DollarSign, CheckSquare, PiggyBank } from "lucide-react";
import { EventActionsClient } from "@/components/events/EventActionsClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) notFound();

  const [eventSponsorsData, guestsData, tasksData, budgetData] = await Promise.all([
    db
      .select({
        id: eventSponsors.id,
        sponsorId: eventSponsors.sponsorId,
        tier: eventSponsors.tier,
        contribution: eventSponsors.contribution,
        notes: eventSponsors.notes,
        companyName: sponsors.companyName,
        contactName: sponsors.contactName,
        email: sponsors.email,
      })
      .from(eventSponsors)
      .innerJoin(sponsors, eq(eventSponsors.sponsorId, sponsors.id))
      .where(eq(eventSponsors.eventId, id)),
    db.select().from(guests).where(eq(guests.eventId, id)),
    db.select().from(tasks).where(eq(tasks.eventId, id)),
    db.select().from(budgetCategories).where(eq(budgetCategories.eventId, id)),
  ]);

  const totalContributions = eventSponsorsData.reduce((s, e) => s + (e.contribution ?? 0), 0);
  const confirmedGuests = guestsData.filter((g) => g.rsvpStatus === "confirmed").length;
  const completedTasks = tasksData.filter((t) => t.status === "done").length;
  const totalPlanned = budgetData.reduce((s, b) => s + (b.plannedAmount ?? 0), 0);
  const totalActual = budgetData.reduce((s, b) => s + (b.actualAmount ?? 0), 0);

  const location = [event.city, event.state, event.country].filter(Boolean).join(", ");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/events" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{event.name}</h1>
              <Badge className={STATUS_COLORS[event.status ?? "planning"]}>
                {event.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(event.date)}{event.venue && ` · ${event.venue}`}{location && ` · ${location}`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" render={<Link href={`/events/${id}/edit`} />}>
          <Pencil className="mr-1 h-3 w-3" /> Edit
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Sponsors", value: eventSponsorsData.length, sub: formatCurrency(totalContributions), icon: DollarSign },
          { label: "Guests", value: guestsData.length, sub: `${confirmedGuests} confirmed`, icon: Users },
          { label: "Tasks", value: tasksData.length, sub: `${completedTasks} done`, icon: CheckSquare },
          { label: "Budget", value: formatCurrency(totalPlanned), sub: `${formatCurrency(totalActual)} actual`, icon: PiggyBank },
        ].map(({ label, value, sub, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-2 pt-4">
              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xl font-semibold leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label} · {sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <EventActionsClient
        event={event}
        eventSponsors={eventSponsorsData}
        guests={guestsData}
        tasks={tasksData}
        budget={budgetData}
        eventId={id}
      />
    </div>
  );
}
