"use client";

import { useCallback, useEffect, useState } from "react";
import { flushOutbox, listenForSyncMessages, registerBackgroundSync } from "@/lib/sync-engine";
import { getOutbox } from "@/lib/indexeddb";

export function useOnlineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    try {
      const items = await getOutbox();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const sync = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    setSyncing(true);
    try {
      await flushOutbox();
      setLastSyncedAt(new Date().toISOString());
    } finally {
      setSyncing(false);
      refreshPending();
    }
  }, [refreshPending]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    refreshPending();

    const onOnline = () => {
      setIsOnline(true);
      sync();
      registerBackgroundSync();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const unsubscribe = listenForSyncMessages(sync);
    const interval = setInterval(refreshPending, 4000);

    if (navigator.onLine) sync();

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { isOnline, pendingCount, lastSyncedAt, syncing, sync };
}
