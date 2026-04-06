import { EventForm } from "@/components/events/EventForm";

export default function NewEventPage() {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">New Event</h1>
      <EventForm />
    </div>
  );
}
