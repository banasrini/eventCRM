import { db } from "@/db";
import { tasks } from "@/db/schema";
import { UpdateTaskSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await ctx.params;
  const body = await request.json();
  const parsed = UpdateTaskSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .update(tasks)
    .set({ ...parsed.data, updatedAt: new Date().toISOString() })
    .where(eq(tasks.id, taskId))
    .returning();

  if (!row) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string; taskId: string }> }
) {
  const { taskId } = await ctx.params;
  await db.delete(tasks).where(eq(tasks.id, taskId));
  return new Response(null, { status: 204 });
}
