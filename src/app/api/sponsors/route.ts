import { db } from "@/db";
import { sponsors } from "@/db/schema";
import { generateId } from "@/lib/utils";
import { CreateSponsorSchema } from "@/lib/validations";
import { like, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  const conditions = [];
  if (search) conditions.push(like(sponsors.companyName, `%${search}%`));

  const rows = await db
    .select()
    .from(sponsors)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sponsors.companyName);

  return Response.json(rows);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CreateSponsorSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tags, ...rest } = parsed.data;
  const id = generateId();
  const now = new Date().toISOString();

  const [row] = await db
    .insert(sponsors)
    .values({
      id,
      ...rest,
      tags: tags ? JSON.stringify(tags) : null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return Response.json(row, { status: 201 });
}
