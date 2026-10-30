"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileText, Mic, Save, Square, WifiOff } from "lucide-react";
import { GlassCard, PageHeader, StatusPill } from "@/components/ui";
import { getPatientId, newClientId } from "@/lib/patient";
import { enqueueOutbox, saveDocumentLocal } from "@/lib/indexeddb";
import type { DocumentSummary, HealthDocument } from "@/lib/types";

// Minimal ambient typing for the non-standard Web Speech API used as the
// on-device/edge fallback transcription path (equivalent role to whisper.cpp
// running locally — browsers without it simply skip live captions).
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: unknown) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

export default function ScribePage() {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [processing, setProcessing] = useState(false);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [savedDoc, setSavedDoc] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = async () => {
    setSummary(null);
    setSavedDoc(false);
    setLiveTranscript("");
    setSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
    } catch {
      // Mic permission denied — still allow manual transcript entry below.
    }

    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (SpeechRecognitionCtor) {
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.onresult = (event: unknown) => {
        const e = event as { resultIndex: number; results: { [i: number]: { [j: number]: { transcript: string } }; length: number } };
        let text = "";
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript + " ";
        }
        setLiveTranscript(text.trim());
      };
      recognition.onerror = () => void 0;
      try {
        recognition.start();
        recognitionRef.current = recognition;
      } catch {
        // ignore
      }
    }

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    setRecording(true);
  };

  const stopRecording = async () => {
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    recognitionRef.current?.stop();
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());

    await processVisit();
  };

  const processVisit = async () => {
    setProcessing(true);
    try {
      const transcriptText =
        liveTranscript || "Patient and doctor discussed general wellness check. No live transcript captured on this device.";

      if (navigator.onLine) {
        const form = new FormData();
        form.append("transcript", transcriptText);
        const res = await fetch("/api/scribe", { method: "POST", body: form });
        const data = await res.json();
        if (res.ok) {
          setSummary(data.summary);
          await persist(transcriptText, data.summary);
          return;
        }
      }
      // Offline fallback
      const offlineSummary: DocumentSummary = {
        headline: "Visit recorded offline — sync later for full AI summary",
        plainSummary: "Saved locally. Connect to the internet to let VitalEdge AI generate your structured clinical note.",
        soap: {
          subjective: transcriptText.slice(0, 300),
          objective: "Pending cloud analysis.",
          assessment: "Pending cloud analysis.",
          plan: "Pending cloud analysis.",
        },
        recommendations: ["Reconnect to the internet to generate the complete AI summary."],
      };
      setSummary(offlineSummary);
      await persist(transcriptText, offlineSummary);
    } finally {
      setProcessing(false);
    }
  };

  const persist = async (transcript: string, docSummary: DocumentSummary) => {
    const patientId = getPatientId();
    const doc: HealthDocument = {
      clientId: newClientId("doc"),
      patientId,
      type: "scribe",
      title: `Visit summary — ${new Date().toLocaleDateString()}`,
      rawText: transcript,
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
    setSavedDoc(true);
  };

  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div>
      <PageHeader
        eyebrow="Ambient Clinical Scribe"
        title="Record your consultation"
        description="Listens on-device, transcribes the conversation, and turns it into a structured clinical summary — automatically."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center justify-center gap-5 lg:col-span-1">
          <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-emerald-50">
            {recording && <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400/40" />}
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={processing}
              className={`flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition ${
                recording ? "bg-rose-500 shadow-rose-500/40" : "bg-emerald-600 shadow-emerald-600/40"
              }`}
            >
              {recording ? <Square size={30} /> : <Mic size={32} />}
            </button>
          </div>
          <p className="text-2xl font-bold tabular-nums text-emerald-950">
            {mins}:{secs}
          </p>
          <p className="text-sm font-medium text-emerald-700">
            {processing ? "Generating clinical summary…" : recording ? "Listening…" : "Tap to start recording"}
          </p>
          {!navigator.onLine && (
            <p className="flex items-center gap-1.5 text-xs text-amber-600">
              <WifiOff size={13} /> Offline — a draft summary will sync & upgrade later
            </p>
          )}
        </GlassCard>

        <GlassCard className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <FileText size={18} /> Live transcript (on-device)
          </h2>
          <div className="scrollbar-thin mt-3 h-40 overflow-y-auto rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 text-sm text-emerald-900">
            {liveTranscript || "Your conversation will appear here as it's captured locally…"}
          </div>

          {summary && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-emerald-950">{summary.headline}</h3>
                {savedDoc && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
                    <CheckCircle2 size={14} /> Saved to timeline
                  </span>
                )}
              </div>
              <p className="text-sm text-emerald-800">{summary.plainSummary}</p>
              {summary.soap && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {(["subjective", "objective", "assessment", "plan"] as const).map((key) => (
                    <div key={key} className="rounded-xl border border-emerald-100 bg-white/70 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600">{key}</p>
                      <p className="mt-1 text-xs text-emerald-800">{summary.soap?.[key]}</p>
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
              <div className="flex items-center gap-2">
                <StatusPill status="normal" />
                <span className="flex items-center gap-1 text-xs text-emerald-600">
                  <Save size={12} /> Auto-saved to your health timeline
                </span>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
