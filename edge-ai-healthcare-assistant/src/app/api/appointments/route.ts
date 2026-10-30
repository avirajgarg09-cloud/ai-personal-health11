import { db } from "@/db";
import { appointments } from "@/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const patientId = req.nextUrl.searchParams.get("patientId");
  if (!patientId) return Response.json({ error: "patientId required" }, { status: 400 });
  const rows = await db
    .select()
    .from(appointments)
    .where(eq(appointments.patientId, patientId))
    .orderBy(asc(appointments.slotStart));
  return Response.json({ appointments: rows });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, patientId, doctorName, department, slotStart, status, notes } = body;
    if (!clientId || !patientId || !doctorName || !slotStart) {
      return Response.json(
        { error: "clientId, patientId, doctorName, and slotStart are required" },
        { status: 400 },
      );
    }
    await db
      .insert(appointments)
      .values({
        clientId,
        patientId,
        doctorName,
        department: department ?? null,
        slotStart: new Date(slotStart),
        status: status ?? "pending",
        notes: notes ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: appointments.clientId,
        set: {
          doctorName,
          department: department ?? null,
          slotStart: new Date(slotStart),
          status: status ?? "pending",
          notes: notes ?? null,
          updatedAt: sql`now()`,
        },
      });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save appointment" }, { status: 500 });
  }
}
