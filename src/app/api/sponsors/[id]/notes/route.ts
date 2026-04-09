import { db } from "@/db";
import { sponsorNotes } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { eq, desc } from "drizzle-orm";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: sponsorId } = await ctx.params;

  const notes = await db
    .select()
    .from(sponsorNotes)
    .where(eq(sponsorNotes.sponsorId, sponsorId))
    .orderBy(desc(sponsorNotes.createdAt));

  return Response.json(notes);
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: sponsorId } = await ctx.params;
  const body = await request.json() as { content: string; source?: string };

  if (!body.content?.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }

  const [note] = await db
    .insert(sponsorNotes)
    .values({
      id: generateId(),
      sponsorId,
      content: body.content.trim(),
      source: body.source || null,
      createdAt: new Date().toISOString(),
    })
    .returning();

  return Response.json(note, { status: 201 });
}

export async function DELETE(
  request: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await ctx.params; // ensure params resolved
  const url = new URL(request.url);
  const noteId = url.searchParams.get("noteId");
  if (!noteId) return Response.json({ error: "noteId required" }, { status: 400 });

  await db.delete(sponsorNotes).where(eq(sponsorNotes.id, noteId));
  return new Response(null, { status: 204 });
}
