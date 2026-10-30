"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Appointment, HealthDocument, OutboxItem, Profile, Vital } from "./types";

interface VitalEdgeDB extends DBSchema {
  profile: { key: string; value: Profile };
  vitals: { key: string; value: Vital; indexes: { recordedAt: string } };
  documents: { key: string; value: HealthDocument; indexes: { createdAt: string } };
  appointments: { key: string; value: Appointment; indexes: { slotStart: string } };
  outbox: { key: string; value: OutboxItem };
}

let dbPromise: Promise<IDBPDatabase<VitalEdgeDB>> | null = null;

export function getDb() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser");
  }
  if (!dbPromise) {
    dbPromise = openDB<VitalEdgeDB>("vitaledge", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("profile")) {
          db.createObjectStore("profile", { keyPath: "clientId" });
        }
        if (!db.objectStoreNames.contains("vitals")) {
          const store = db.createObjectStore("vitals", { keyPath: "clientId" });
          store.createIndex("recordedAt", "recordedAt");
        }
        if (!db.objectStoreNames.contains("documents")) {
          const store = db.createObjectStore("documents", { keyPath: "clientId" });
          store.createIndex("createdAt", "createdAt");
        }
        if (!db.objectStoreNames.contains("appointments")) {
          const store = db.createObjectStore("appointments", { keyPath: "clientId" });
          store.createIndex("slotStart", "slotStart");
        }
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ---------- Profile ----------
export async function saveProfileLocal(profile: Profile) {
  const db = await getDb();
  await db.put("profile", profile);
}
export async function getProfileLocal(clientId: string) {
  const db = await getDb();
  return db.get("profile", clientId);
}
export async function getAnyProfileLocal() {
  const db = await getDb();
  const all = await db.getAll("profile");
  return all[0] ?? null;
}

// ---------- Vitals ----------
export async function saveVitalLocal(vital: Vital) {
  const db = await getDb();
  await db.put("vitals", vital);
}
export async function getAllVitalsLocal() {
  const db = await getDb();
  return (await db.getAllFromIndex("vitals", "recordedAt")).reverse();
}

// ---------- Documents ----------
export async function saveDocumentLocal(doc: HealthDocument) {
  const db = await getDb();
  await db.put("documents", doc);
}
export async function getAllDocumentsLocal() {
  const db = await getDb();
  return (await db.getAllFromIndex("documents", "createdAt")).reverse();
}
export async function getDocumentsByTypeLocal(type: HealthDocument["type"]) {
  const docs = await getAllDocumentsLocal();
  return docs.filter((d) => d.type === type);
}

// ---------- Appointments ----------
export async function saveAppointmentLocal(appt: Appointment) {
  const db = await getDb();
  await db.put("appointments", appt);
}
export async function getAllAppointmentsLocal() {
  const db = await getDb();
  return (await db.getAllFromIndex("appointments", "slotStart")).reverse();
}

// ---------- Outbox (Conflict Resolution Engine queue) ----------
export async function enqueueOutbox(item: OutboxItem) {
  const db = await getDb();
  await db.put("outbox", item);
}
export async function getOutbox() {
  const db = await getDb();
  return db.getAll("outbox");
}
export async function removeFromOutbox(id: string) {
  const db = await getDb();
  await db.delete("outbox", id);
}
export async function bumpOutboxAttempt(id: string) {
  const db = await getDb();
  const item = await db.get("outbox", id);
  if (item) {
    item.attempts += 1;
    await db.put("outbox", item);
  }
}
