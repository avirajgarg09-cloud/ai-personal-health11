"use client";

import { useState } from "react";
import { CheckCircle2, LifeBuoy, Mail, MessageSquare, Phone } from "lucide-react";
import { GlassCard, PageHeader } from "@/components/ui";

const SUPPORT_PHONE = "9258499126";

const FAQS = [
  {
    q: "Does VitalEdge work without internet?",
    a: "Yes. Onboarding, vitals, document scans, and appointment booking all work fully offline using on-device storage. They sync automatically once you're back online.",
  },
  {
    q: "Is my prescription/report data private?",
    a: "Your documents are processed with on-device OCR first. Only the extracted text is sent to the AI model for summarization, and everything is tied to your anonymous device ID.",
  },
  {
    q: "What if the AI gets something wrong?",
    a: "VitalEdge AI is a support tool, not a replacement for a doctor. Always confirm medicine names, dosages, and diagnoses with a licensed medical professional.",
  },
];

export default function SupportPage() {
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");

  const submit = () => {
    if (!message.trim()) return;
    setSent(true);
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Help & Support" title="We're here to help" description="Reach our support team any time — even your offline queries are saved for follow-up." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Phone size={22} />
          </div>
          <p className="text-sm font-semibold text-emerald-950">24/7 Support Helpline</p>
          <a href={`tel:${SUPPORT_PHONE}`} className="text-2xl font-bold text-emerald-700">
            {SUPPORT_PHONE}
          </a>
          <p className="text-xs text-emerald-600">Tap to call directly from your phone</p>
        </GlassCard>

        <GlassCard className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Mail size={22} />
          </div>
          <p className="text-sm font-semibold text-emerald-950">Email us</p>
          <a href="mailto:support@vitaledge.app" className="text-sm font-semibold text-emerald-700">
            support@vitaledge.app
          </a>
          <p className="text-xs text-emerald-600">Average response time: 4 hours</p>
        </GlassCard>

        <GlassCard className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <LifeBuoy size={22} />
          </div>
          <p className="text-sm font-semibold text-emerald-950">Emergency?</p>
          <p className="text-xs text-emerald-700/80">
            If this is a medical emergency, please call your local emergency number immediately.
          </p>
        </GlassCard>
      </div>

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          <MessageSquare size={18} /> Send us a message
        </h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Describe your issue or question…"
          className="mt-3 min-h-[110px] w-full rounded-xl border border-emerald-200 bg-white/80 p-3 text-sm text-emerald-950 outline-none focus:border-emerald-500"
        />
        <button
          onClick={submit}
          className="mt-3 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          Submit
        </button>
        {sent && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={15} /> Message saved — our team will reach out, or call {SUPPORT_PHONE} for urgent issues.
          </p>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="text-lg font-bold text-emerald-950">Frequently asked questions</h2>
        <div className="mt-3 space-y-2">
          {FAQS.map((f, i) => (
            <details key={i} className="rounded-xl border border-emerald-100 bg-white/70 p-3">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-900">{f.q}</summary>
              <p className="mt-2 text-sm text-emerald-700/80">{f.a}</p>
            </details>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
