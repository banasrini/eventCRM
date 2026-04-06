import { notFound } from "next/navigation";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EventForm } from "@/components/events/EventForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const [event] = await db.select().from(events).where(eq(events.id, id));
  if (!event) notFound();

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Edit Event</h1>
      <EventForm event={event} />
    </div>
  );
}
