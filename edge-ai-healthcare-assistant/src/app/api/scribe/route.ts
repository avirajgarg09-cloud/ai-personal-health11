import { summarizeClinicalConversation, transcribeAudio } from "@/lib/openai";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio") as File | null;
    const existingTranscript = form.get("transcript") as string | null;

    let transcript = existingTranscript?.trim() || "";
    if (!transcript && audio) {
      transcript = await transcribeAudio(audio);
    }
    if (!transcript) {
      return Response.json({ error: "No audio or transcript provided" }, { status: 400 });
    }

    const summary = await summarizeClinicalConversation(transcript);
    return Response.json({ transcript, summary });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to process the recording" }, { status: 500 });
  }
}
