import { db } from "@/db";
import {
  sponsors,
  events,
  eventSponsors,
  guests,
  tasks,
  budgetCategories,
} from "@/db/schema";
import { generateId } from "@/lib/utils";
import { like, eq, and, count, sum } from "drizzle-orm";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolInput = Record<string, any>;

export async function handleTool(
  toolName: string,
  input: ToolInput
): Promise<unknown> {
  switch (toolName) {
    case "search_sponsors": {
      const conditions = [];
      if (input.query) conditions.push(like(sponsors.companyName, `%${input.query}%`));
      return db
        .select()
        .from(sponsors)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(sponsors.companyName)
        .limit(10);
    }

    case "create_sponsor": {
      const now = new Date().toISOString();
      const [row] = await db
        .insert(sponsors)
        .values({
          id: generateId(),
          companyName: input.company_name,
          contactName: input.contact_name,
          email: input.email,
          phone: input.phone,
          url: input.url,
          city: input.city,
          state: input.state,
          country: input.country,
          notes: input.notes,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    }

    case "update_sponsor": {
      const { sponsor_id, tags, ...rest } = input;
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (rest.company_name !== undefined) updates.companyName = rest.company_name;
      if (rest.contact_name !== undefined) updates.contactName = rest.contact_name;
      if (rest.email !== undefined) updates.email = rest.email;
      if (rest.phone !== undefined) updates.phone = rest.phone;
      if (rest.url !== undefined) updates.url = rest.url;
      if (rest.city !== undefined) updates.city = rest.city;
      if (rest.state !== undefined) updates.state = rest.state;
      if (rest.notes !== undefined) updates.notes = rest.notes;
      if (tags !== undefined) updates.tags = JSON.stringify(tags);

      const [row] = await db
        .update(sponsors)
        .set(updates)
        .where(eq(sponsors.id, sponsor_id))
        .returning();
      return row ?? { error: "Sponsor not found" };
    }

    case "search_events": {
      const conditions = [];
      if (input.query) conditions.push(like(events.name, `%${input.query}%`));
      if (input.status) conditions.push(eq(events.status, input.status));
      return db
        .select()
        .from(events)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(events.date)
        .limit(10);
    }

    case "create_event": {
      const now = new Date().toISOString();
      const [row] = await db
        .insert(events)
        .values({
          id: generateId(),
          name: input.name,
          date: input.date,
          venue: input.venue,
          city: input.city,
          state: input.state,
          status: input.status ?? "planning",
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    }

    case "attach_sponsor_to_event": {
      const { event_id, sponsor_id, ...rest } = input;
      // Upsert
      const existing = await db
        .select()
        .from(eventSponsors)
        .where(
          and(
            eq(eventSponsors.eventId, event_id),
            eq(eventSponsors.sponsorId, sponsor_id)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const [row] = await db
          .update(eventSponsors)
          .set({
            tier: rest.tier,
            contribution: rest.contribution,
            notes: rest.notes,
          })
          .where(eq(eventSponsors.id, existing[0].id))
          .returning();
        return { ...row, action: "updated" };
      }

      const [row] = await db
        .insert(eventSponsors)
        .values({
          id: generateId(),
          eventId: event_id,
          sponsorId: sponsor_id,
          tier: rest.tier,
          contribution: rest.contribution,
          notes: rest.notes,
        })
        .returning();
      return { ...row, action: "created" };
    }

    case "add_guest": {
      const now = new Date().toISOString();
      const [row] = await db
        .insert(guests)
        .values({
          id: generateId(),
          eventId: input.event_id,
          sponsorId: input.sponsor_id ?? null,
          name: input.name,
          email: input.email,
          rsvpStatus: input.rsvp_status ?? "pending",
          role: input.role ?? "attendee",
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    }

    case "update_guest_rsvp": {
      const { guest_id, ...rest } = input;
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (rest.rsvp_status !== undefined) updates.rsvpStatus = rest.rsvp_status;
      if (rest.role !== undefined) updates.role = rest.role;

      const [row] = await db
        .update(guests)
        .set(updates)
        .where(eq(guests.id, guest_id))
        .returning();
      return row ?? { error: "Guest not found" };
    }

    case "search_guests": {
      const conditions = [];
      if (input.event_id) conditions.push(eq(guests.eventId, input.event_id));
      if (input.name) conditions.push(like(guests.name, `%${input.name}%`));
      return db
        .select()
        .from(guests)
        .where(conditions.length ? and(...conditions) : undefined)
        .limit(20);
    }

    case "create_task": {
      const now = new Date().toISOString();
      const [row] = await db
        .insert(tasks)
        .values({
          id: generateId(),
          eventId: input.event_id,
          title: input.title,
          assignedTo: input.assigned_to,
          dueDate: input.due_date,
          status: input.status ?? "todo",
          notes: input.notes,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      return row;
    }

    case "update_task": {
      const { task_id, ...rest } = input;
      const updates: Record<string, unknown> = {
        updatedAt: new Date().toISOString(),
      };
      if (rest.title !== undefined) updates.title = rest.title;
      if (rest.status !== undefined) updates.status = rest.status;
      if (rest.assigned_to !== undefined) updates.assignedTo = rest.assigned_to;
      if (rest.due_date !== undefined) updates.dueDate = rest.due_date;

      const [row] = await db
        .update(tasks)
        .set(updates)
        .where(eq(tasks.id, task_id))
        .returning();
      return row ?? { error: "Task not found" };
    }

    case "get_sponsor_history": {
      return db
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
        .where(eq(eventSponsors.sponsorId, input.sponsor_id))
        .orderBy(events.date);
    }

    case "get_event_summary": {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, input.event_id));
      if (!event) return { error: "Event not found" };

      const [sponsorCountRow] = await db
        .select({ count: count() })
        .from(eventSponsors)
        .where(eq(eventSponsors.eventId, input.event_id));
      const [guestCountRow] = await db
        .select({ count: count() })
        .from(guests)
        .where(eq(guests.eventId, input.event_id));
      const [taskCountRow] = await db
        .select({ count: count() })
        .from(tasks)
        .where(eq(tasks.eventId, input.event_id));
      const [budgetRow] = await db
        .select({
          planned: sum(budgetCategories.plannedAmount),
          actual: sum(budgetCategories.actualAmount),
        })
        .from(budgetCategories)
        .where(eq(budgetCategories.eventId, input.event_id));
      const [contributionRow] = await db
        .select({ total: sum(eventSponsors.contribution) })
        .from(eventSponsors)
        .where(eq(eventSponsors.eventId, input.event_id));

      return {
        event,
        sponsorCount: sponsorCountRow.count,
        guestCount: guestCountRow.count,
        taskCount: taskCountRow.count,
        totalContributions: contributionRow.total ?? 0,
        plannedBudget: budgetRow.planned ?? 0,
        actualBudget: budgetRow.actual ?? 0,
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}
