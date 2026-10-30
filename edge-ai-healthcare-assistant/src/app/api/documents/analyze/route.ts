import { analyzePrescription, translateDiagnosticReport } from "@/lib/openai";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { type, text } = (await req.json()) as { type: "prescription" | "report"; text: string };
    if (!text || !type) {
      return Response.json({ error: "type and text are required" }, { status: 400 });
    }
    const summary =
      type === "prescription" ? await analyzePrescription(text) : await translateDiagnosticReport(text);
    return Response.json({ summary });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to analyze document" }, { status: 500 });
  }
}
