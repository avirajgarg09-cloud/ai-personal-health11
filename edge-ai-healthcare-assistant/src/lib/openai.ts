import OpenAI from "openai";
import type { DocumentSummary } from "./types";

const apiKey = process.env.OPENAI_API_KEY;
export const hasOpenAI = Boolean(apiKey);

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1";

function safeJsonParse<T>(raw: string, fallback: T): T {
  try {
    const cleaned = raw
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "");
    return JSON.parse(cleaned) as T;
  } catch {
    return fallback;
  }
}

/**
 * Cloud fallback transcription (OpenAI Whisper API). On-device, the client
 * first attempts the Web Speech API / whisper.cpp-wasm edge path; this
 * route is only hit when a raw audio blob needs server-side transcription
 * or when higher accuracy is required.
 */
export async function transcribeAudio(file: File): Promise<string> {
  if (!openai) {
    return "[Offline/No API key] Edge transcription unavailable — connect to sync this recording to the cloud Whisper model.";
  }
  const transcription = await openai.audio.transcriptions.create({
    file,
    model: TRANSCRIBE_MODEL,
  });
  return transcription.text;
}

export async function summarizeClinicalConversation(transcript: string): Promise<DocumentSummary> {
  if (!openai) {
    return mockClinicalSummary(transcript);
  }
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are an ambient clinical scribe AI. Given a raw doctor-patient conversation transcript, produce a structured clinical visit summary in strict JSON matching this TypeScript type: " +
          "{ headline: string, plainSummary: string, soap: { subjective: string, objective: string, assessment: string, plan: string }, recommendations: string[] }. " +
          "Be concise, clinically accurate, and use layman-friendly language in plainSummary. Respond with JSON only, no markdown fences.",
      },
      { role: "user", content: transcript },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return safeJsonParse<DocumentSummary>(raw, mockClinicalSummary(transcript));
}

export async function analyzePrescription(ocrText: string): Promise<DocumentSummary> {
  if (!openai) {
    return mockPrescriptionSummary(ocrText);
  }
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a clinical pharmacology assistant. You are given OCR-extracted text from a handwritten or printed prescription. " +
          "Identify every medicine mentioned (correct likely OCR typos using medical knowledge), and respond with strict JSON matching: " +
          "{ headline: string, plainSummary: string, medicines: { name: string, dosage: string, uses: string, sideEffects: string }[], recommendations: string[] }. " +
          "'uses' should explain in 1-2 plain sentences what the medicine treats. 'sideEffects' should list common side effects in plain language. " +
          "Always include a recommendation to consult the prescribing doctor/pharmacist before changing any dose. Respond with JSON only.",
      },
      { role: "user", content: ocrText },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return safeJsonParse<DocumentSummary>(raw, mockPrescriptionSummary(ocrText));
}

export async function translateDiagnosticReport(ocrText: string): Promise<DocumentSummary> {
  if (!openai) {
    return mockReportSummary(ocrText);
  }
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a medical report translator for patients with no medical background. Given OCR text from a lab report, X-ray note, or vitals printout, " +
          "respond with strict JSON matching: { headline: string, plainSummary: string, keyFindings: { label: string, value: string, status: 'normal'|'watch'|'high'|'low' }[], recommendations: string[] }. " +
          "plainSummary must avoid jargon entirely and explain what it means for the patient's day-to-day health. Respond with JSON only.",
      },
      { role: "user", content: ocrText },
    ],
  });
  const raw = completion.choices[0]?.message?.content ?? "{}";
  return safeJsonParse<DocumentSummary>(raw, mockReportSummary(ocrText));
}

export async function chatWithHealthContext(params: {
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  context: string;
}): Promise<string> {
  const { message, history, context } = params;
  if (!openai) {
    return (
      "I'm running in offline demo mode (no OPENAI_API_KEY configured), so I can't reach the cloud model right now. " +
      "Once you're back online with an API key configured, I can answer using your saved documents and vitals. " +
      "For now, here's what I found locally:\n\n" +
      (context.slice(0, 500) || "No saved health context yet — try uploading a report or prescription first.")
    );
  }
  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "You are VitalEdge AI, a friendly, careful personal health assistant embedded in a patient's health dashboard. " +
          "Use the CONTEXT (the patient's profile, vitals, prescriptions, and report summaries) to answer their question accurately. " +
          "Always include a brief safety reminder when discussing medication changes or serious symptoms, and clarify you are not a replacement for a licensed doctor. " +
          "Keep answers concise, warm, and easy to understand.\n\nCONTEXT:\n" +
          context,
      },
      ...history,
      { role: "user", content: message },
    ],
  });
  return completion.choices[0]?.message?.content ?? "I couldn't generate a response just now — please try again.";
}

// ---------------- Offline/no-key fallbacks (deterministic, still useful demo) ----------------

function mockClinicalSummary(transcript: string): DocumentSummary {
  return {
    headline: "Visit summary (offline draft — sync when online for full AI summary)",
    plainSummary:
      "This is a locally generated draft based on the recorded conversation. Connect to the internet to let VitalEdge AI generate the full structured clinical note.",
    soap: {
      subjective: transcript.slice(0, 280) || "No transcript captured.",
      objective: "Pending cloud analysis.",
      assessment: "Pending cloud analysis.",
      plan: "Pending cloud analysis.",
    },
    recommendations: ["Reconnect to the internet to generate a complete AI clinical summary."],
  };
}

function mockPrescriptionSummary(ocrText: string): DocumentSummary {
  const guessedLines = ocrText
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 4);
  return {
    headline: "Prescription captured (offline draft)",
    plainSummary:
      "Text was extracted on-device via OCR. Connect to the internet so VitalEdge AI can identify each medicine with uses and side effects.",
    medicines: guessedLines.map((line) => ({
      name: line.slice(0, 40) || "Unidentified medicine",
      dosage: "—",
      uses: "Pending cloud AI analysis.",
      sideEffects: "Pending cloud AI analysis.",
    })),
    recommendations: ["Always confirm medicine names and dosage with your pharmacist."],
  };
}

function mockReportSummary(ocrText: string): DocumentSummary {
  return {
    headline: "Report captured (offline draft)",
    plainSummary:
      "Text was extracted on-device via OCR. Connect to the internet so VitalEdge AI can translate this into a plain-language summary.",
    keyFindings: [{ label: "Raw excerpt", value: ocrText.slice(0, 120) || "No text detected", status: "normal" }],
    recommendations: ["Reconnect to the internet for a full layman translation of this report."],
  };
}
