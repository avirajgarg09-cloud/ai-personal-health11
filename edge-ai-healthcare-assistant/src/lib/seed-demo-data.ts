"use client";

// Seeds a believable 14-day vitals history + sample documents on first run so
// the dashboard has an instant "wow factor" instead of empty charts. All data
// stays local until the user is online, at which point it syncs like any
// other record.
import { newClientId } from "./patient";
import { enqueueOutbox, getAllVitalsLocal, saveDocumentLocal, saveVitalLocal } from "./indexeddb";
import type { Vital } from "./types";

export async function seedDemoDataIfEmpty(patientId: string) {
  const existing = await getAllVitalsLocal();
  if (existing.length > 0) return;

  const now = Date.now();
  const days = 14;
  const vitals: Vital[] = [];

  for (let i = days; i >= 0; i--) {
    const recordedAt = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
    const drift = Math.sin(i / 2.2) * 4;

    vitals.push({
      clientId: newClientId("vital"),
      patientId,
      type: "blood_pressure",
      systolic: Math.round(122 + drift),
      diastolic: Math.round(80 + drift / 2),
      recordedAt,
      source: "manual",
      createdAt: recordedAt,
    });
    vitals.push({
      clientId: newClientId("vital"),
      patientId,
      type: "blood_sugar",
      value: Math.round(108 + drift * 2),
      unit: "mg/dL",
      recordedAt,
      source: "manual",
      createdAt: recordedAt,
    });
    vitals.push({
      clientId: newClientId("vital"),
      patientId,
      type: "heart_rate",
      value: Math.round(74 + drift),
      unit: "bpm",
      recordedAt,
      source: "manual",
      createdAt: recordedAt,
    });
    vitals.push({
      clientId: newClientId("vital"),
      patientId,
      type: "spo2",
      value: Math.round(97 + (drift > 0 ? 1 : 0)),
      unit: "%",
      recordedAt,
      source: "manual",
      createdAt: recordedAt,
    });
  }

  for (const vital of vitals) {
    await saveVitalLocal(vital);
    await enqueueOutbox({
      id: newClientId("outbox"),
      entity: "vital",
      payload: vital,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
  }

  const sampleDoc = {
    clientId: newClientId("doc"),
    patientId,
    type: "report" as const,
    title: "Annual Blood Panel (sample)",
    rawText: "Hemoglobin 13.8 g/dL, Fasting Glucose 108 mg/dL, Cholesterol 192 mg/dL",
    summary: {
      headline: "Mostly healthy panel with one value to watch",
      plainSummary:
        "Your blood counts look healthy overall. Your fasting glucose is a little above the ideal range, which is worth discussing at your next check-up, but it is not an emergency.",
      keyFindings: [
        { label: "Hemoglobin", value: "13.8 g/dL", status: "normal" as const },
        { label: "Fasting Glucose", value: "108 mg/dL", status: "watch" as const },
        { label: "Cholesterol", value: "192 mg/dL", status: "normal" as const },
      ],
      recommendations: ["Recheck fasting glucose in 3 months", "Maintain low-sugar diet"],
    },
    createdAt: new Date().toISOString(),
  };
  await saveDocumentLocal(sampleDoc);
}
