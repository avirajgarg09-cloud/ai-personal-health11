"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAnyProfileLocal } from "@/lib/indexeddb";

export default function RootGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profile = await getAnyProfileLocal();
        if (cancelled) return;
        router.replace(profile ? "/dashboard" : "/onboarding");
      } catch {
        router.replace("/onboarding");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
        <p className="text-sm font-medium text-emerald-700">
          {checking ? "Loading VitalEdge…" : "Redirecting…"}
        </p>
      </div>
    </main>
  );
}
