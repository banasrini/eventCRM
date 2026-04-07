export const dynamic = "force-dynamic";
import Link from "next/link";
import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { like, and } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Plus } from "lucide-react";
import { SponsorSearch } from "@/components/sponsors/SponsorSearch";
import { DeleteSponsorButton } from "@/components/sponsors/DeleteSponsorButton";

interface PageProps {
  searchParams: Promise<{ search?: string }>;
}

export default async function SponsorsPage({ searchParams }: PageProps) {
  const { search } = await searchParams;

  const conditions = [];
  if (search) conditions.push(like(sponsors.companyName, `%${search}%`));

  const rows = await db
    .select()
    .from(sponsors)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sponsors.companyName);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sponsors</h1>
        <Button render={<Link href="/sponsors/new" />}>
          <Plus className="mr-1 h-4 w-4" /> New Sponsor
        </Button>
      </div>

      <SponsorSearch defaultSearch={search} />

      {rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <p>No sponsors found.</p>
          <Button variant="outline" className="mt-4" render={<Link href="/sponsors/new" />}>
            Add your first sponsor
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <Link href={`/sponsors/${s.id}`} className="font-medium hover:underline">
                    {s.companyName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.contactName ?? "—"}
                </TableCell>
                <TableCell className="text-sm">
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[160px] block">
                      {s.url.replace(/^https?:\/\//, "")}
                    </a>
                  ) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {[s.city, s.state, s.country].filter(Boolean).join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(s.createdAt)}
                </TableCell>
                <TableCell>
                  <DeleteSponsorButton sponsorId={s.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
