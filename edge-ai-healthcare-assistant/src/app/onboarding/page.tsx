"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartPulse, ShieldCheck, Sparkles, User } from "lucide-react";
import { getPatientId, newClientId } from "@/lib/patient";
import { saveProfileLocal, enqueueOutbox } from "@/lib/indexeddb";
import type { Profile } from "@/lib/types";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"];
const STEPS = ["Basics", "Vitals Identity", "Medical History"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Female",
    bloodGroup: "O+",
    phone: "",
    conditions: "",
    allergies: "",
    medications: "",
  });

  const update = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 1;
    return true;
  };

  const finish = async () => {
    setSaving(true);
    const clientId = getPatientId();
    const profile: Profile = {
      clientId,
      name: form.name.trim(),
      age: form.age ? Number(form.age) : null,
      gender: form.gender || null,
      bloodGroup: form.bloodGroup || null,
      phone: form.phone || null,
      conditions: form.conditions || null,
      allergies: form.allergies || null,
      medications: form.medications || null,
      language: "en",
      updatedAt: new Date().toISOString(),
    };

    await saveProfileLocal(profile);
    await enqueueOutbox({
      id: newClientId("outbox"),
      entity: "profile",
      payload: profile,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });

    if (navigator.onLine) {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      }).catch(() => void 0);
    }

    router.replace("/dashboard");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-green-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <HeartPulse size={22} />
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-emerald-900">VitalEdge</p>
            <p className="text-xs text-emerald-600">Offline-first health companion</p>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8">
          <div className="mb-6 flex items-center gap-2">
            {STEPS.map((label, idx) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition ${
                    idx <= step ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-500"
                  }`}
                >
                  {idx + 1}
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 rounded ${idx < step ? "bg-emerald-600" : "bg-emerald-100"}`} />
                )}
              </div>
            ))}
          </div>

          <h1 className="text-2xl font-bold text-emerald-950">
            {step === 0 && "Let's get to know you"}
            {step === 1 && "A few vitals basics"}
            {step === 2 && "Basic medical history"}
          </h1>
          <p className="mt-1 text-sm text-emerald-700">
            {step === 0 && "Saved instantly to this device — works even without internet."}
            {step === 1 && "Helps us personalize your dashboard & emergency info."}
            {step === 2 && "Optional, but helps the AI assistant give safer answers."}
          </p>

          <div className="mt-6 space-y-4">
            {step === 0 && (
              <>
                <Field label="Full name">
                  <input
                    autoFocus
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    placeholder="e.g. Asha Verma"
                    className="input-field"
                  />
                </Field>
                <Field label="Phone number">
                  <input
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="e.g. 98765 43210"
                    className="input-field"
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Age">
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => update("age", e.target.value)}
                      placeholder="e.g. 29"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Gender">
                    <select
                      value={form.gender}
                      onChange={(e) => update("gender", e.target.value)}
                      className="input-field"
                    >
                      {["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => (
                        <option key={g}>{g}</option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Blood group">
                  <div className="grid grid-cols-5 gap-2">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => update("bloodGroup", bg)}
                        className={`rounded-xl border px-2 py-2 text-sm font-semibold transition ${
                          form.bloodGroup === bg
                            ? "border-emerald-600 bg-emerald-600 text-white shadow"
                            : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400"
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Existing conditions">
                  <textarea
                    value={form.conditions}
                    onChange={(e) => update("conditions", e.target.value)}
                    placeholder="e.g. Type 2 diabetes, hypertension"
                    className="input-field min-h-[64px]"
                  />
                </Field>
                <Field label="Known allergies">
                  <textarea
                    value={form.allergies}
                    onChange={(e) => update("allergies", e.target.value)}
                    placeholder="e.g. Penicillin, peanuts"
                    className="input-field min-h-[64px]"
                  />
                </Field>
                <Field label="Current medications">
                  <textarea
                    value={form.medications}
                    onChange={(e) => update("medications", e.target.value)}
                    placeholder="e.g. Metformin 500mg twice daily"
                    className="input-field min-h-[64px]"
                  />
                </Field>
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="rounded-xl px-4 py-2 text-sm font-medium text-emerald-700 disabled:opacity-0"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue <Sparkles size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={saving}
                onClick={finish}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 disabled:opacity-60"
              >
                <ShieldCheck size={16} /> {saving ? "Saving…" : "Enter my dashboard"}
              </button>
            )}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-emerald-600">
          <User size={14} /> Stored locally first (IndexedDB) and synced securely when you&apos;re online.
        </p>
      </div>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(16, 185, 129, 0.25);
          background: rgba(255,255,255,0.8);
          padding: 0.65rem 0.9rem;
          font-size: 0.9rem;
          color: #064e3b;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .input-field:focus {
          border-color: #16a34a;
          box-shadow: 0 0 0 3px rgba(34,197,94,0.15);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
        {label}
      </span>
      {children}
    </label>
  );
}
