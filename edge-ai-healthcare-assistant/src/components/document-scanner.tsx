"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Pill, ScanText, Sparkles, UploadCloud } from "lucide-react";
import { GlassCard, StatusPill } from "@/components/ui";
import { recognizeImageText, type OcrProgress } from "@/lib/ocr";
import { getPatientId, newClientId } from "@/lib/patient";
import { enqueueOutbox, saveDocumentLocal } from "@/lib/indexeddb";
import type { DocumentSummary, DocumentType, HealthDocument } from "@/lib/types";

export function DocumentScanner({
  docType,
  title,
  helperText,
  accentLabel,
  onSaved,
}: {
  docType: DocumentType;
  title: string;
  helperText: string;
  accentLabel: string;
  onSaved?: (doc: HealthDocument) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState<OcrProgress | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setOcrText("");
    setOcrStatus(null);
    setSummary(null);
    setSaved(false);
  };

  const handleFile = async (file: File) => {
    reset();
    setPreview(URL.createObjectURL(file));
    try {
      const text = await recognizeImageText(file, setOcrStatus);
      setOcrText(text);
      await analyze(text);
    } catch {
      setOcrStatus({ status: "OCR failed — try a clearer photo", progress: 0 });
    }
  };

  const analyze = async (text: string) => {
    setAnalyzing(true);
    try {
      let result: DocumentSummary | null = null;
      if (navigator.onLine) {
        const res = await fetch("/api/documents/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: docType, text }),
        });
        const data = await res.json();
        if (res.ok) result = data.summary;
      }
      if (!result) {
        result = {
          headline: "Captured offline — analyze later for full AI breakdown",
          plainSummary:
            "Text was extracted on this device. Reconnect to the internet to generate the full AI explanation with uses & side effects.",
          medicines: docType === "prescription" ? [{ name: "Detected text", uses: "Pending analysis", sideEffects: "Pending analysis" }] : undefined,
          keyFindings: docType === "report" ? [{ label: "Raw excerpt", value: text.slice(0, 100), status: "normal" }] : undefined,
          recommendations: ["Reconnect to the internet for a complete AI-powered explanation."],
        };
      }
      setSummary(result);
      await persist(text, result);
    } finally {
      setAnalyzing(false);
    }
  };

  const persist = async (text: string, docSummary: DocumentSummary) => {
    const patientId = getPatientId();
    const doc: HealthDocument = {
      clientId: newClientId("doc"),
      patientId,
      type: docType,
      title: docSummary.headline || title,
      rawText: text,
      summary: docSummary,
      createdAt: new Date().toISOString(),
    };
    await saveDocumentLocal(doc);
    await enqueueOutbox({
      id: newClientId("outbox"),
      entity: "document",
      payload: doc,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    setSaved(true);
    onSaved?.(doc);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <GlassCard className="lg:col-span-1">
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          <ScanText size={18} /> {title}
        </h2>
        <p className="mt-1 text-xs text-emerald-700/70">{helperText}</p>

        <button
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/60 px-4 py-10 text-emerald-600 transition hover:bg-emerald-50"
        >
          <UploadCloud size={28} />
          <span className="text-sm font-semibold">Upload or snap a photo</span>
          <span className="text-xs text-emerald-500">On-device OCR — works offline</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {preview && (
          <div className="mt-4 overflow-hidden rounded-xl border border-emerald-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Uploaded document" className="max-h-56 w-full object-contain bg-white" />
          </div>
        )}

        {ocrStatus && (
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
            <Loader2 size={13} className={ocrStatus.progress < 1 ? "animate-spin" : "hidden"} />
            {ocrStatus.status} {ocrStatus.progress ? `(${Math.round(ocrStatus.progress * 100)}%)` : ""}
          </div>
        )}
      </GlassCard>

      <GlassCard className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Sparkles size={18} /> {accentLabel}
          </h2>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <CheckCircle2 size={14} /> Saved to timeline
            </span>
          )}
        </div>

        {!ocrText && !analyzing && (
          <p className="mt-6 text-sm text-emerald-700/70">Upload a document to see the extracted text and AI explanation here.</p>
        )}

        {ocrText && (
          <details className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-xs text-emerald-800">
            <summary className="cursor-pointer font-semibold text-emerald-700">Raw OCR text</summary>
            <p className="mt-2 whitespace-pre-wrap">{ocrText}</p>
          </details>
        )}

        {analyzing && (
          <div className="mt-6 flex items-center gap-2 text-sm text-emerald-700">
            <Loader2 size={16} className="animate-spin" /> Asking VitalEdge AI to explain this document…
          </div>
        )}

        {summary && (
          <div className="mt-5 space-y-4">
            <div>
              <h3 className="text-base font-bold text-emerald-950">{summary.headline}</h3>
              <p className="mt-1 text-sm text-emerald-800">{summary.plainSummary}</p>
            </div>

            {summary.medicines && summary.medicines.length > 0 && (
              <div className="space-y-3">
                {summary.medicines.map((m, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-white/70 p-4">
                    <div className="flex items-center gap-2">
                      <Pill size={15} className="text-emerald-600" />
                      <p className="font-bold text-emerald-950">{m.name}</p>
                      {m.dosage && <span className="ml-auto text-xs font-medium text-emerald-500">{m.dosage}</span>}
                    </div>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-emerald-50 p-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">Uses</p>
                        <p className="mt-0.5 text-xs text-emerald-900">{m.uses}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 p-2.5">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600">Side effects</p>
                        <p className="mt-0.5 text-xs text-amber-900">{m.sideEffects}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {summary.keyFindings && summary.keyFindings.length > 0 && (
              <div className="space-y-2">
                {summary.keyFindings.map((f, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-emerald-100 bg-white/70 px-4 py-2.5">
                    <span className="text-sm font-medium text-emerald-900">{f.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-950">{f.value}</span>
                      <StatusPill status={f.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {summary.recommendations && summary.recommendations.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Recommendations</p>
                <ul className="mt-1 list-inside list-disc text-sm text-emerald-800">
                  {summary.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
