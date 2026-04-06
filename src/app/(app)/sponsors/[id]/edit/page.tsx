import { notFound } from "next/navigation";
import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SponsorForm } from "@/components/sponsors/SponsorForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSponsorPage({ params }: PageProps) {
  const { id } = await params;
  const [sponsor] = await db.select().from(sponsors).where(eq(sponsors.id, id));
  if (!sponsor) notFound();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Edit Sponsor</h1>
      <SponsorForm sponsor={sponsor} />
    </div>
  );
}
