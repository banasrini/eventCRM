export const dynamic = "force-dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { sponsors, eventSponsors, events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATUS_COLORS, TIER_COLORS, formatDate, formatCurrency } from "@/lib/utils";
import { Pencil, ArrowLeft } from "lucide-react";
import { DeleteSponsorButton } from "@/components/sponsors/DeleteSponsorButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SponsorDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, id));
  if (!sponsor) notFound();

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

  const tags: string[] = sponsor.tags ? JSON.parse(sponsor.tags) : [];
  const location = [sponsor.city, sponsor.state, sponsor.country].filter(Boolean).join(", ");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/sponsors" />}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{sponsor.companyName}</h1>
            </div>
            {location && (
              <p className="text-sm text-muted-foreground mt-0.5">{location}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/sponsors/${id}/edit`} />}>
            <Pencil className="mr-1 h-3 w-3" /> Edit
          </Button>
          <DeleteSponsorButton sponsorId={id} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact</span>
              <span>{sponsor.contactName ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              {sponsor.email ? (
                <a href={`mailto:${sponsor.email}`} className="hover:underline text-blue-600">
                  {sponsor.email}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{sponsor.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Website</span>
              {sponsor.url ? (
                <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-600 truncate max-w-[200px]">
                  {sponsor.url.replace(/^https?:\/\//, "")}
                </a>
              ) : (
                <span>—</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location</span>
              <span>{location || "—"}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Notes & Tags</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-muted-foreground">{sponsor.notes || "No notes."}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Event History ({history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-right">Contribution</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h) => (
                  <TableRow key={h.eventId}>
                    <TableCell>
                      <Link href={`/events/${h.eventId}`} className="font-medium hover:underline">
                        {h.eventName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(h.eventDate)}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[h.eventStatus ?? "planning"]}>
                        {h.eventStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {h.tier ? (
                        <Badge variant="outline" className={`capitalize ${TIER_COLORS[h.tier]}`}>
                          {h.tier}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(h.contribution)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
