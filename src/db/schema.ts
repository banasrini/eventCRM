import { sqliteTable, text, real, unique } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const sponsors = sqliteTable("sponsors", {
  id: text("id").primaryKey(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  url: text("url"),
  targetCustomerRevenue: text("target_customer_revenue"),
  notes: text("notes"),
  aiSummary: text("ai_summary"), // JSON: { relationshipStatus, whatTheyCareAbout, personalDetails, openActionItems, sentiment }
  aiSummaryAt: text("ai_summary_at"),
  tags: text("tags"), // JSON string: string[]
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  date: text("date"), // ISO-8601 date
  venue: text("venue"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  status: text("status", { enum: ["planning", "active", "completed"] }).default("planning"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const eventSponsors = sqliteTable(
  "event_sponsors",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    sponsorId: text("sponsor_id")
      .notNull()
      .references(() => sponsors.id, { onDelete: "cascade" }),
    tier: text("tier", { enum: ["gold", "silver", "bronze", "custom"] }),
    contribution: real("contribution"),
    notes: text("notes"),
    createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  },
  (t) => [unique().on(t.eventId, t.sponsorId)]
);

export const guests = sqliteTable("guests", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  sponsorId: text("sponsor_id").references(() => sponsors.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  email: text("email"),
  company: text("company"),
  contactedVia: text("contacted_via", { enum: ["linkedin", "email", "msg"] }),
  rsvpStatus: text("rsvp_status", {
    enum: ["pending", "confirmed", "declined"],
  }).default("pending"),
  role: text("role", {
    enum: ["vip", "sponsor", "speaker", "attendee"],
  }).default("attendee"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  assignedTo: text("assigned_to"),
  dueDate: text("due_date"),
  status: text("status", { enum: ["todo", "in_progress", "done"] }).default(
    "todo"
  ),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const budgetCategories = sqliteTable("budget_categories", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  plannedAmount: real("planned_amount").default(0),
  actualAmount: real("actual_amount").default(0),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const venueOptions = sqliteTable("venue_options", {
  id: text("id").primaryKey(),
  eventId: text("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  costPerEvent: real("cost_per_event"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const sponsorNotes = sqliteTable("sponsor_notes", {
  id: text("id").primaryKey(),
  sponsorId: text("sponsor_id")
    .notNull()
    .references(() => sponsors.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  source: text("source"), // e.g. "email", "meeting", "linkedin", "note"
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  toolCalls: text("tool_calls"), // JSON
  createdAt: text("created_at").default(sql`(CURRENT_TIMESTAMP)`),
});

// Inferred types for use throughout the app
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventSponsor = typeof eventSponsors.$inferSelect;
export type NewEventSponsor = typeof eventSponsors.$inferInsert;
export type Guest = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type NewBudgetCategory = typeof budgetCategories.$inferInsert;
export type VenueOption = typeof venueOptions.$inferSelect;
export type NewVenueOption = typeof venueOptions.$inferInsert;
export type SponsorNote = typeof sponsorNotes.$inferSelect;
export type NewSponsorNote = typeof sponsorNotes.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
