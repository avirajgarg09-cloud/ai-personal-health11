"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, Sparkles, X } from "lucide-react";
import { getPatientId } from "@/lib/patient";
import { getAllDocumentsLocal, getAllVitalsLocal, getProfileLocal } from "@/lib/indexeddb";
import type { ChatMessage } from "@/lib/types";

async function buildHealthContext(): Promise<string> {
  const patientId = getPatientId();
  const profile = await getProfileLocal(patientId);
  const vitals = (await getAllVitalsLocal()).slice(0, 10);
  const documents = (await getAllDocumentsLocal()).slice(0, 6);

  const lines: string[] = [];
  if (profile) {
    lines.push(
      `Patient: ${profile.name}, age ${profile.age ?? "unknown"}, blood group ${profile.bloodGroup ?? "unknown"}.`,
    );
    if (profile.conditions) lines.push(`Known conditions: ${profile.conditions}`);
    if (profile.allergies) lines.push(`Allergies: ${profile.allergies}`);
    if (profile.medications) lines.push(`Current medications: ${profile.medications}`);
  }
  if (vitals.length) {
    lines.push("Recent vitals:");
    vitals.forEach((v) => {
      const val = v.type === "blood_pressure" ? `${v.systolic}/${v.diastolic}` : `${v.value}${v.unit ?? ""}`;
      lines.push(`- ${v.type} = ${val} on ${new Date(v.recordedAt).toLocaleDateString()}`);
    });
  }
  if (documents.length) {
    lines.push("Saved documents:");
    documents.forEach((d) => {
      lines.push(`- [${d.type}] ${d.title}: ${d.summary?.headline ?? "No summary yet"}`);
    });
  }
  return lines.join("\n") || "No saved health data yet.";
}

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! I'm your VitalEdge AI assistant. Ask me about your prescriptions, reports, or recent vitals — I can see everything saved on this device.",
      createdAt: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const context = await buildHealthContext();
      const history = [...messages, userMsg].slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, context }),
      });
      const data = await res.json();
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: res.ok ? data.reply : "I'm offline right now — I'll be able to help as soon as you're reconnected.",
        createdAt: new Date().toISOString(),
      };
      setMessages((m) => [...m, reply]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "You appear to be offline. Your question is saved — reconnect and ask again for a full answer.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-700/40 transition hover:scale-105 hover:bg-emerald-700"
        aria-label="Open AI chat assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[32rem] w-[22rem] max-w-[92vw] flex-col overflow-hidden rounded-3xl glass-panel shadow-2xl">
          <div className="flex items-center gap-2 bg-emerald-600 px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
              <Bot size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">VitalEdge AI</p>
              <p className="text-[11px] text-emerald-100">Context-aware health assistant</p>
            </div>
            <Sparkles size={16} className="ml-auto text-emerald-100" />
          </div>

          <div ref={scrollRef} className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-br-sm bg-emerald-600 text-white"
                      : "rounded-bl-sm bg-white text-emerald-900 shadow-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-xs text-emerald-600">
                <Loader2 size={14} className="animate-spin" /> Thinking…
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-emerald-100 bg-white/70 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about your meds, reports…"
              className="flex-1 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-950 outline-none focus:border-emerald-500"
            />
            <button
              onClick={send}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
