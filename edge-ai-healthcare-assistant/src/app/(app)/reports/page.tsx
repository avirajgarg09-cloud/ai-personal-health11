"use client";

import { useState } from "react";
import { FileHeart, Sparkles } from "lucide-react";
import { PageHeader, GlassCard } from "@/components/ui";
import { DocumentScanner } from "@/components/document-scanner";
import type { DocumentSummary } from "@/lib/types";
import { getPatientId, newClientId } from "@/lib/patient";
import { enqueueOutbox, saveDocumentLocal } from "@/lib/indexeddb";

export default function ReportsPage() {
  const [manualText, setManualText] = useState("");
  const [manualSummary, setManualSummary] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const translateManual = async () => {
    if (!manualText.trim()) return;
    setLoading(true);
    try {
      let result: DocumentSummary | null = null;
      if (navigator.onLine) {
        const res = await fetch("/api/documents/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "report", text: manualText }),
        });
        const data = await res.json();
        if (res.ok) result = data.summary;
      }
      if (!result) {
        result = {
          headline: "Captured offline",
          plainSummary: "Reconnect to the internet for a full layman translation.",
          keyFindings: [{ label: "Raw text", value: manualText.slice(0, 80), status: "normal" }],
          recommendations: ["Reconnect to the internet to translate this report."],
        };
      }
      setManualSummary(result);
      const patientId = getPatientId();
      const doc = {
        clientId: newClientId("doc"),
        patientId,
        type: "report" as const,
        title: result.headline,
        rawText: manualText,
        summary: result,
        createdAt: new Date().toISOString(),
      };
      await saveDocumentLocal(doc);
      await enqueueOutbox({ id: newClientId("outbox"), entity: "document", payload: doc, createdAt: new Date().toISOString(), attempts: 0 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Diagnostic Report Translator"
        title="Blood tests, X-rays & vitals — explained simply"
        description="Upload a photo, or paste the report text directly, and get a plain-language explanation of what it means for you."
      />
      <DocumentScanner
        docType="report"
        title="Upload report"
        helperText="Blood test, X-ray note, BP or sugar printout."
        accentLabel="Plain-language explanation"
      />

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          <FileHeart size={18} /> Or paste report text manually
        </h2>
        <textarea
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Paste lab values or doctor's notes here…"
          className="mt-3 min-h-[120px] w-full rounded-xl border border-emerald-200 bg-white/80 p-3 text-sm text-emerald-950 outline-none focus:border-emerald-500"
        />
        <button
          onClick={translateManual}
          disabled={loading || !manualText.trim()}
          className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Sparkles size={16} /> {loading ? "Translating…" : "Translate with AI"}
        </button>

        {manualSummary && (
          <div className="mt-5 space-y-3">
            <h3 className="text-base font-bold text-emerald-950">{manualSummary.headline}</h3>
            <p className="text-sm text-emerald-800">{manualSummary.plainSummary}</p>
            {manualSummary.keyFindings?.map((f, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white/70 px-4 py-2.5">
                <span className="text-sm font-medium text-emerald-900">{f.label}</span>
                <span className="text-sm font-bold text-emerald-950">{f.value}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
