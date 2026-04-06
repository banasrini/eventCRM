import { db } from "@/db";
import { budgetCategories } from "@/db/schema";
import { UpdateBudgetCategorySchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; catId: string }> }
) {
  const { catId } = await ctx.params;
  const body = await request.json();
  const parsed = UpdateBudgetCategorySchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(budgetCategories)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(budgetCategories.id, catId))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; catId: string }> }
) {
  const { catId } = await ctx.params;
  await db.delete(budgetCategories).where(eq(budgetCategories.id, catId));
  return new Response(null, { status: 204 });
}
