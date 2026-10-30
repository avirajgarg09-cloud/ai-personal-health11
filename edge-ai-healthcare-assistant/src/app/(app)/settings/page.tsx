"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Globe, RefreshCw, Save, User, WifiOff } from "lucide-react";
import { GlassCard, PageHeader } from "@/components/ui";
import { getPatientId, newClientId } from "@/lib/patient";
import { enqueueOutbox, getProfileLocal, saveProfileLocal } from "@/lib/indexeddb";
import { useOnlineSync } from "@/hooks/use-online-sync";
import { useLanguage, LANGUAGES } from "@/lib/i18n";
import type { Profile } from "@/lib/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState(false);
  const { isOnline, pendingCount, lastSyncedAt, syncing, sync } = useOnlineSync();
  const { lang, setLang } = useLanguage();

  useEffect(() => {
    getProfileLocal(getPatientId()).then((p) => setProfile(p ?? null));
  }, []);

  const update = (key: keyof Profile, value: string) =>
    setProfile((p) => (p ? { ...p, [key]: value } : p));

  const save = async () => {
    if (!profile) return;
    const updated = { ...profile, updatedAt: new Date().toISOString() };
    await saveProfileLocal(updated);
    await enqueueOutbox({
      id: newClientId("outbox"),
      entity: "profile",
      payload: updated,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    if (navigator.onLine) {
      fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      }).catch(() => void 0);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (!profile) {
    return <p className="text-sm text-emerald-700">Loading your profile…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Manage your account" description="Edit your details, change language, and check sync status." />

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          <User size={18} /> Personal details
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input value={profile.name} onChange={(e) => update("name", e.target.value)} className="input-field" />
          </Field>
          <Field label="Phone">
            <input value={profile.phone ?? ""} onChange={(e) => update("phone", e.target.value)} className="input-field" />
          </Field>
          <Field label="Age">
            <input
              type="number"
              value={profile.age ?? ""}
              onChange={(e) => setProfile((p) => (p ? { ...p, age: Number(e.target.value) } : p))}
              className="input-field"
            />
          </Field>
          <Field label="Blood group">
            <input value={profile.bloodGroup ?? ""} onChange={(e) => update("bloodGroup", e.target.value)} className="input-field" />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Conditions">
            <textarea value={profile.conditions ?? ""} onChange={(e) => update("conditions", e.target.value)} className="input-field min-h-[70px]" />
          </Field>
          <Field label="Allergies">
            <textarea value={profile.allergies ?? ""} onChange={(e) => update("allergies", e.target.value)} className="input-field min-h-[70px]" />
          </Field>
          <Field label="Medications">
            <textarea value={profile.medications ?? ""} onChange={(e) => update("medications", e.target.value)} className="input-field min-h-[70px]" />
          </Field>
        </div>

        <button
          onClick={save}
          className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
        >
          <Save size={16} /> Save changes
        </button>
        {saved && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 size={15} /> Saved locally — syncing when online
          </p>
        )}
      </GlassCard>

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          <Globe size={18} /> Language
        </h2>
        <p className="text-xs text-emerald-700/70">Choose your preferred display language.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                lang === l.code ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-200 bg-white text-emerald-700 hover:border-emerald-400"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
          {isOnline ? <RefreshCw size={18} /> : <WifiOff size={18} />} Offline sync status
        </h2>
        <p className="mt-1 text-sm text-emerald-700/80">
          {isOnline ? "You're connected." : "You're offline — changes are queued locally."} {pendingCount} item
          {pendingCount === 1 ? "" : "s"} pending sync.
        </p>
        {lastSyncedAt && (
          <p className="mt-1 text-xs text-emerald-600">Last synced {new Date(lastSyncedAt).toLocaleTimeString()}</p>
        )}
        <button
          onClick={sync}
          disabled={syncing || !isOnline}
          className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          <RefreshCw size={15} className={syncing ? "animate-spin" : ""} /> Sync now
        </button>
      </GlassCard>

      <style>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgba(16, 185, 129, 0.25);
          background: rgba(255,255,255,0.8);
          padding: 0.6rem 0.85rem;
          font-size: 0.875rem;
          color: #064e3b;
          outline: none;
        }
        .input-field:focus { border-color: #16a34a; box-shadow: 0 0 0 3px rgba(34,197,94,0.15); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-emerald-700/80">{label}</span>
      {children}
    </label>
  );
}
