import { z } from "zod";

export const TierEnum = z.enum(["gold", "silver", "bronze", "custom"]);
export const StatusEnum = z.enum(["planning", "active", "completed"]);
export const RsvpEnum = z.enum(["pending", "confirmed", "declined"]);
export const RoleEnum = z.enum(["vip", "sponsor", "speaker", "attendee"]);
export const TaskStatusEnum = z.enum(["todo", "in_progress", "done"]);

export const CreateSponsorSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  url: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const UpdateSponsorSchema = CreateSponsorSchema.partial();

export const CreateEventSchema = z.object({
  name: z.string().min(1),
  date: z.string().optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  status: StatusEnum.optional().default("planning"),
  notes: z.string().optional(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export const AttachSponsorSchema = z.object({
  sponsorId: z.string().min(1),
  tier: TierEnum.optional(),
  contribution: z.number().optional(),
  notes: z.string().optional(),
});

export const UpdateEventSponsorSchema = z.object({
  tier: TierEnum.optional(),
  contribution: z.number().optional(),
  notes: z.string().optional(),
});

export const CreateGuestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().optional(),
  contactedVia: z.enum(["linkedin", "email", "msg"]).optional(),
  rsvpStatus: RsvpEnum.optional().default("pending"),
  role: RoleEnum.optional().default("attendee"),
  sponsorId: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateGuestSchema = CreateGuestSchema.partial();

export const CreateTaskSchema = z.object({
  title: z.string().min(1),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  status: TaskStatusEnum.optional().default("todo"),
  notes: z.string().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

export const CreateBudgetCategorySchema = z.object({
  name: z.string().min(1),
  plannedAmount: z.number().optional().default(0),
  actualAmount: z.number().optional().default(0),
  notes: z.string().optional(),
});

export const UpdateBudgetCategorySchema = CreateBudgetCategorySchema.partial();
