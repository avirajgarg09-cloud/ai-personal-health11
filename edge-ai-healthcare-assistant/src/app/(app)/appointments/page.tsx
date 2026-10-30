"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Clock, Stethoscope, WifiOff } from "lucide-react";
import { GlassCard, PageHeader } from "@/components/ui";
import { getPatientId, newClientId } from "@/lib/patient";
import { enqueueOutbox, getAllAppointmentsLocal, saveAppointmentLocal } from "@/lib/indexeddb";
import type { Appointment } from "@/lib/types";

const DOCTORS = [
  { name: "Dr. Meera Nair", department: "General Physician" },
  { name: "Dr. Arjun Rao", department: "Cardiology" },
  { name: "Dr. Priya Sharma", department: "Endocrinology" },
  { name: "Dr. Kabir Singh", department: "Dermatology" },
];

const SLOTS = ["09:00 AM", "10:30 AM", "12:00 PM", "02:30 PM", "04:00 PM", "05:30 PM"];

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctor, setDoctor] = useState(DOCTORS[0]);
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);
  const days = useMemo(() => nextDays(10), []);

  useEffect(() => {
    getAllAppointmentsLocal().then(setAppointments);
  }, []);

  const book = async () => {
    if (!slot) return;
    const [time, meridian] = slot.split(" ");
    const [hStr, mStr] = time.split(":");
    let hours = parseInt(hStr, 10);
    if (meridian === "PM" && hours !== 12) hours += 12;
    if (meridian === "AM" && hours === 12) hours = 0;

    const slotDate = new Date(days[day]);
    slotDate.setHours(hours, parseInt(mStr, 10), 0, 0);

    const patientId = getPatientId();
    const appt: Appointment = {
      clientId: newClientId("appt"),
      patientId,
      doctorName: doctor.name,
      department: doctor.department,
      slotStart: slotDate.toISOString(),
      status: "pending",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    await saveAppointmentLocal(appt);
    await enqueueOutbox({
      id: newClientId("outbox"),
      entity: "appointment",
      payload: appt,
      createdAt: new Date().toISOString(),
      attempts: 0,
    });
    if (navigator.onLine) {
      fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appt),
      }).catch(() => void 0);
    }

    setAppointments(await getAllAppointmentsLocal());
    setBooked(true);
    setSlot(null);
    setTimeout(() => setBooked(false), 3500);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Appointments"
        title="Book your next visit"
        description="Select a doctor and time slot. Bookings made offline are queued and synced automatically once you're back online."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Stethoscope size={18} /> Choose a doctor
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {DOCTORS.map((d) => (
              <button
                key={d.name}
                onClick={() => setDoctor(d)}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  doctor.name === d.name ? "border-emerald-600 bg-emerald-50" : "border-emerald-100 bg-white/70 hover:border-emerald-300"
                }`}
              >
                <p className="text-sm font-bold text-emerald-950">{d.name}</p>
                <p className="text-xs text-emerald-600">{d.department}</p>
              </button>
            ))}
          </div>

          <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-emerald-950">
            <CalendarClock size={18} /> Choose a date
          </h2>
          <div className="scrollbar-thin mt-3 flex gap-2 overflow-x-auto pb-1">
            {days.map((d, i) => (
              <button
                key={i}
                onClick={() => setDay(i)}
                className={`flex min-w-[64px] flex-col items-center rounded-xl border px-3 py-2.5 transition ${
                  day === i ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white/70 text-emerald-800 hover:border-emerald-300"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase">
                  {d.toLocaleDateString(undefined, { weekday: "short" })}
                </span>
                <span className="text-lg font-bold">{d.getDate()}</span>
                <span className="text-[10px]">{d.toLocaleDateString(undefined, { month: "short" })}</span>
              </button>
            ))}
          </div>

          <h2 className="mt-6 flex items-center gap-2 text-lg font-bold text-emerald-950">
            <Clock size={18} /> Choose a time
          </h2>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {SLOTS.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                  slot === s ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white/70 text-emerald-800 hover:border-emerald-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={book}
            disabled={!slot}
            className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:opacity-40"
          >
            <CheckCircle2 size={16} /> Confirm booking
          </button>

          {booked && (
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={15} /> Appointment queued
              {!navigator.onLine && (
                <span className="flex items-center gap-1 text-amber-600">
                  <WifiOff size={13} /> will sync when you're back online
                </span>
              )}
            </p>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="text-lg font-bold text-emerald-950">Upcoming appointments</h2>
          <div className="scrollbar-thin mt-3 space-y-3" style={{ maxHeight: 520, overflowY: "auto" }}>
            {appointments.length === 0 && <p className="text-sm text-emerald-700/60">No appointments booked yet.</p>}
            {appointments.map((a) => (
              <div key={a.clientId} className="rounded-2xl border border-emerald-100 bg-white/70 p-3">
                <p className="text-sm font-bold text-emerald-950">{a.doctorName}</p>
                <p className="text-xs text-emerald-600">{a.department}</p>
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  {new Date(a.slotStart).toLocaleString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
