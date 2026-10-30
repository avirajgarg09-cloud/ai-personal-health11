import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) return Response.json({ error: "clientId required" }, { status: 400 });
  const row = await db.select().from(profiles).where(eq(profiles.clientId, clientId)).limit(1);
  return Response.json({ profile: row[0] ?? null });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, name, age, gender, bloodGroup, phone, conditions, allergies, medications, language } = body;
    if (!clientId || !name) {
      return Response.json({ error: "clientId and name are required" }, { status: 400 });
    }

    await db
      .insert(profiles)
      .values({
        clientId,
        name,
        age: age ?? null,
        gender: gender ?? null,
        bloodGroup: bloodGroup ?? null,
        phone: phone ?? null,
        conditions: conditions ?? null,
        allergies: allergies ?? null,
        medications: medications ?? null,
        language: language ?? "en",
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: profiles.clientId,
        set: {
          name,
          age: age ?? null,
          gender: gender ?? null,
          bloodGroup: bloodGroup ?? null,
          phone: phone ?? null,
          conditions: conditions ?? null,
          allergies: allergies ?? null,
          medications: medications ?? null,
          language: language ?? "en",
          updatedAt: sql`now()`,
        },
      });

    return Response.json({ ok: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
