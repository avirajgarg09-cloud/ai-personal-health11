import { db } from "@/db";
import { vitals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) return Response.json({ error: "patientId required" }, { status: 400 });
  const rows = await db
    .select()
    .from(vitals)
    .where(eq(vitals.patientId, patientId))
    .orderBy(desc(vitals.recordedAt));
  return Response.json({ vitals: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, patientId, type, systolic, diastolic, value, unit, recordedAt, source } = body;
    if (!clientId || !patientId || !type) {
      return Response.json({ error: "clientId, patientId, and type are required" }, { status: 400 });
    }
    await db
      .insert(vitals)
      .values({
        clientId,
        patientId,
        type,
        systolic: systolic ?? null,
        diastolic: diastolic ?? null,
        value: value ?? null,
        unit: unit ?? null,
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
        source: source ?? "manual",
      })
      .onConflictDoNothing({ target: vitals.clientId });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save vital" }, { status: 500 });
  }
}
