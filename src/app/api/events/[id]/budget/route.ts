import { db } from "@/db";
import { budgetCategories } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { CreateBudgetCategorySchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/events/[id]/budget">
) {
  const { id: eventId } = await ctx.params;
  const rows = await db
    .select()
    .from(budgetCategories)
    .where(eq(budgetCategories.eventId, eventId));
  return Response.json(rows);
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/events/[id]/budget">
) {
  const { id: eventId } = await ctx.params;
  const body = await request.json();
  const parsed = CreateBudgetCategorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date().toISOString();
  const [row] = await db
    .insert(budgetCategories)
    .values({ id: generateId(), eventId, ...parsed.data, createdAt: now, updatedAt: now })
    .returning();

  return Response.json(row, { status: 201 });
}
