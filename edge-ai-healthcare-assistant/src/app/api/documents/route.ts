import { db } from "@/db";
import { documents } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) return Response.json({ error: "patientId required" }, { status: 400 });
  const rows = await db
    .select()
    .from(documents)
    .where(eq(documents.patientId, patientId))
    .orderBy(desc(documents.createdAt));
  return Response.json({ documents: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, patientId, type, title, rawText, summary } = body;
    if (!clientId || !patientId || !type) {
      return Response.json({ error: "clientId, patientId, and type are required" }, { status: 400 });
    }
    await db
      .insert(documents)
      .values({
        clientId,
        patientId,
        type,
        title: title ?? null,
        rawText: rawText ?? null,
        summary: summary ?? null,
      })
      .onConflictDoNothing({ target: documents.clientId });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save document" }, { status: 500 });
  }
}
