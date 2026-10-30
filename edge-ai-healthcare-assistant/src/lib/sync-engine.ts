"use client";

// Conflict Resolution Engine
// --------------------------
// Every local write is (1) applied to IndexedDB immediately so the UI is
// instant & offline-capable, and (2) pushed onto the "outbox" queue.
// When connectivity returns, `flushOutbox` replays the queue against the
// Postgres-backed API routes. Each row carries a stable `clientId` (uuid)
// so the server can safely UPSERT — last-write-wins by `updatedAt` for
// mutable entities (profile/appointments), while vitals/documents are
// treated as immutable facts (insert-if-not-exists).

import { bumpOutboxAttempt, getOutbox, removeFromOutbox } from "./indexeddb";
import type { OutboxItem } from "./types";

const ENDPOINTS: Record<OutboxItem["entity"], string> = {
  profile: "/api/profile",
  vital: "/api/vitals",
  document: "/api/documents",
  appointment: "/api/appointments",
};

export type SyncResult = { pushed: number; failed: number; remaining: number };

let syncing = false;

export async function flushOutbox(): Promise<SyncResult> {
  if (syncing) return { pushed: 0, failed: 0, remaining: (await getOutbox()).length };
  syncing = true;
  let pushed = 0;
  let failed = 0;
  try {
    const items = await getOutbox();
    for (const item of items) {
      try {
        const res = await fetch(ENDPOINTS[item.entity], {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (!res.ok) throw new Error(`sync failed: ${res.status}`);
        await removeFromOutbox(item.id);
        pushed += 1;
      } catch {
        failed += 1;
        await bumpOutboxAttempt(item.id);
      }
    }
  } finally {
    syncing = false;
  }
  const remaining = (await getOutbox()).length;
  return { pushed, failed, remaining };
}

export function registerBackgroundSync() {
  if (typeof window === "undefined") return;
  navigator.serviceWorker?.ready
    .then((reg) => {
      const syncReg = reg as ServiceWorkerRegistration & {
        sync?: { register: (tag: string) => Promise<void> };
      };
      return syncReg.sync?.register("vitaledge-sync");
    })
    .catch(() => void 0);
}

export function listenForSyncMessages(onSync: () => void) {
  if (typeof window === "undefined") return () => void 0;
  const handler = (event: MessageEvent) => {
    if (event.data?.type === "VITALEDGE_SYNC_NOW") onSync();
  };
  navigator.serviceWorker?.addEventListener("message", handler);
  return () => navigator.serviceWorker?.removeEventListener("message", handler);
}
