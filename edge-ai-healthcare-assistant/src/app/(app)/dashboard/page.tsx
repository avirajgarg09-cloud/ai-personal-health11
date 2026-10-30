"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Droplets,
  FileHeart,
  HeartPulse,
  Thermometer,
  Wind,
} from "lucide-react";
import { getPatientId } from "@/lib/patient";
import { getAllDocumentsLocal, getAllVitalsLocal, getAnyProfileLocal } from "@/lib/indexeddb";
import { seedDemoDataIfEmpty } from "@/lib/seed-demo-data";
import type { HealthDocument, Profile, Vital } from "@/lib/types";
import { GlassCard, PageHeader, StatusPill } from "@/components/ui";
import { BodyModel } from "@/components/body-model";
import { VitalsTrendChart, type TrendPoint } from "@/components/charts/vitals-trend-chart";
import { HealthDistributionPie } from "@/components/charts/health-distribution-pie";

type Metric = "blood_pressure" | "blood_sugar" | "heart_rate" | "spo2";

const METRIC_META: Record<Metric, { label: string; unit: string; icon: typeof HeartPulse; color: string }> = {
  blood_pressure: { label: "Blood Pressure", unit: " mmHg", icon: HeartPulse, color: "text-rose-500" },
  blood_sugar: { label: "Blood Sugar", unit: " mg/dL", icon: Droplets, color: "text-amber-500" },
  heart_rate: { label: "Heart Rate", unit: " bpm", icon: Activity, color: "text-emerald-600" },
  spo2: { label: "SpO₂", unit: "%", icon: Wind, color: "text-sky-500" },
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [documents, setDocuments] = useState<HealthDocument[]>([]);
  const [metric, setMetric] = useState<Metric>("blood_pressure");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const patientId = getPatientId();
      await seedDemoDataIfEmpty(patientId);
      const [p, v, d] = await Promise.all([getAnyProfileLocal(), getAllVitalsLocal(), getAllDocumentsLocal()]);
      setProfile(p);
      setVitals(v);
      setDocuments(d);
      setLoading(false);
    })();
  }, []);

  const trendData: TrendPoint[] = useMemo(() => {
    const filtered = vitals.filter((v) => v.type === metric).slice(0, 15).reverse();
    return filtered.map((v) => ({
      date: new Date(v.recordedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      primary: metric === "blood_pressure" ? Number(v.systolic) : Number(v.value),
      secondary: metric === "blood_pressure" ? Number(v.diastolic) : undefined,
    }));
  }, [vitals, metric]);

  const latest = (type: Metric) => vitals.find((v) => v.type === type);

  const distribution = useMemo(() => {
    const counts: Record<string, number> = { Prescriptions: 0, Reports: 0, "Scribe notes": 0 };
    documents.forEach((d) => {
      if (d.type === "prescription") counts.Prescriptions += 1;
      else if (d.type === "report") counts.Reports += 1;
      else counts["Scribe notes"] += 1;
    });
    const statusCounts: Record<string, number> = { Normal: 0, "Needs attention": 0 };
    documents.forEach((d) => {
      const watch = d.summary?.keyFindings?.some((f) => f.status === "watch" || f.status === "high" || f.status === "low");
      if (watch) statusCounts["Needs attention"] += 1;
      else statusCounts.Normal += 1;
    });
    const docEntries = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const hasDocs = docEntries.some((e) => e.value > 0);
    return hasDocs ? docEntries : [{ name: "No documents yet", value: 1 }];
  }, [documents]);

  if (loading) {
    return (
      <div className="grid h-[60vh] place-items-center text-emerald-600">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back${profile?.name ? `, ${profile.name.split(" ")[0]}` : ""} 👋`}
        description="Your vitals, documents, and AI insights — synced across devices and available offline."
        action={
          <Link
            href="/appointments"
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700"
          >
            Book appointment <ArrowUpRight size={16} />
          </Link>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {(Object.keys(METRIC_META) as Metric[]).map((key) => {
          const meta = METRIC_META[key];
          const Icon = meta.icon;
          const v = latest(key);
          const display =
            key === "blood_pressure" && v ? `${v.systolic}/${v.diastolic}` : v ? `${v.value}` : "—";
          return (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={`text-left transition ${metric === key ? "scale-[1.02]" : ""}`}
            >
              <GlassCard className={`!p-4 ${metric === key ? "ring-2 ring-emerald-500" : ""}`}>
                <div className="flex items-center justify-between">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 ${meta.color}`}>
                    <Icon size={18} />
                  </span>
                  <StatusPill status="normal" />
                </div>
                <p className="mt-3 text-2xl font-bold text-emerald-950">
                  {display}
                  <span className="ml-1 text-xs font-medium text-emerald-600">{meta.unit}</span>
                </p>
                <p className="text-xs font-medium text-emerald-700/70">{meta.label}</p>
              </GlassCard>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left / center column */}
        <div className="space-y-6 lg:col-span-2">
          <GlassCard>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-emerald-950">Trends over time</h2>
                <p className="text-xs text-emerald-700/70">Last {trendData.length} recorded readings</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(METRIC_META) as Metric[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setMetric(key)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      metric === key ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    {METRIC_META[key].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <VitalsTrendChart
                data={trendData}
                primaryLabel={metric === "blood_pressure" ? "Systolic" : METRIC_META[metric].label}
                secondaryLabel={metric === "blood_pressure" ? "Diastolic" : undefined}
                unit={METRIC_META[metric].unit}
              />
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <GlassCard>
              <h2 className="text-lg font-bold text-emerald-950">Document distribution</h2>
              <p className="text-xs text-emerald-700/70">Prescriptions, reports & scribe notes</p>
              <HealthDistributionPie data={distribution} />
            </GlassCard>

            <GlassCard className="flex flex-col">
              <h2 className="text-lg font-bold text-emerald-950">Recent documents</h2>
              <p className="text-xs text-emerald-700/70">AI-generated summaries</p>
              <div className="scrollbar-thin mt-3 flex-1 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: 260 }}>
                {documents.length === 0 && (
                  <p className="text-sm text-emerald-700/60">No documents uploaded yet.</p>
                )}
                {documents.slice(0, 6).map((d) => (
                  <div key={d.clientId} className="rounded-2xl border border-emerald-100 bg-white/70 p-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                        <FileHeart size={13} /> {d.type}
                      </span>
                      <span className="text-[11px] text-emerald-500">
                        {new Date(d.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-emerald-950">{d.title}</p>
                    <p className="line-clamp-2 text-xs text-emerald-700/70">{d.summary?.headline}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <Link href="/prescriptions" className="flex-1 rounded-xl bg-emerald-50 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                  Analyze prescription
                </Link>
                <Link href="/reports" className="flex-1 rounded-xl bg-emerald-50 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                  Translate report
                </Link>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Right column: body model */}
        <div className="lg:col-span-1">
          <div className="h-[560px] lg:h-full lg:min-h-[640px]">
            <BodyModel />
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-3">
          <Thermometer className="text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-950">Blood group</p>
            <p className="text-xs text-emerald-700/70">{profile?.bloodGroup ?? "Not set"}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <Activity className="text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-950">Known conditions</p>
            <p className="line-clamp-1 text-xs text-emerald-700/70">{profile?.conditions || "None recorded"}</p>
          </div>
        </GlassCard>
        <GlassCard className="flex items-center gap-3">
          <HeartPulse className="text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-950">Active medications</p>
            <p className="line-clamp-1 text-xs text-emerald-700/70">{profile?.medications || "None recorded"}</p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
