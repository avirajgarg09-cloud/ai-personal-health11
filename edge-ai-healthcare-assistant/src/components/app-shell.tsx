"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarClock,
  FileHeart,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Mic,
  ScanText,
  Settings,
  Wifi,
  WifiOff,
  X,
  LifeBuoy,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { useOnlineSync } from "@/hooks/use-online-sync";
import { FloatingChat } from "@/components/floating-chat";
import { useLanguage } from "@/lib/i18n";

const NAV = [
  { href: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { href: "/scribe", key: "scribe", icon: Mic },
  { href: "/prescriptions", key: "prescriptions", icon: ScanText },
  { href: "/reports", key: "reports", icon: FileHeart },
  { href: "/appointments", key: "appointments", icon: CalendarClock },
  { href: "/settings", key: "settings", icon: Settings },
  { href: "/support", key: "support", icon: LifeBuoy },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { isOnline, pendingCount, syncing } = useOnlineSync();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-emerald-100 bg-white/80 px-4 py-3 backdrop-blur-lg lg:hidden">
        <Brand />
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-emerald-700 hover:bg-emerald-50">
          <Menu size={22} />
        </button>
      </div>

      <div className="mx-auto flex max-w-[1500px]">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform border-r border-emerald-100/70 bg-white/70 p-5 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <Brand />
            <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-50 lg:hidden">
              <X size={20} />
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-1">
            {NAV.map(({ href, key, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/25"
                      : "text-emerald-800/80 hover:bg-emerald-50"
                  }`}
                >
                  <Icon size={18} />
                  {t(key)}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
              {isOnline ? <Wifi size={16} className="text-emerald-600" /> : <WifiOff size={16} className="text-amber-500" />}
              {isOnline ? t("online") : t("offline")}
            </div>
            <p className="mt-1 text-xs text-emerald-700/80">
              {syncing
                ? "Syncing your records…"
                : pendingCount > 0
                ? `${pendingCount} change${pendingCount === 1 ? "" : "s"} waiting to sync`
                : t("allSynced")}
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
              <div
                className={`h-full rounded-full bg-emerald-500 transition-all ${syncing ? "w-2/3 animate-pulse" : pendingCount > 0 ? "w-1/3" : "w-full"}`}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-2 rounded-xl bg-emerald-950 px-3.5 py-3 text-white">
            <HeartPulse size={18} className="text-emerald-300" />
            <div className="text-xs leading-tight">
              <p className="font-semibold">Emergency support</p>
              <p className="text-emerald-200">Call 9258499126</p>
            </div>
          </div>
        </aside>

        {open && (
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-emerald-950/30 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* Main content */}
        <main className="min-h-screen w-full flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>

      <FloatingChat />
    </div>
  );
}

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
        <HeartPulse size={18} />
      </div>
      <div>
        <p className="text-base font-bold leading-none tracking-tight text-emerald-950">VitalEdge</p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-emerald-500">Offline-first care</p>
      </div>
    </Link>
  );
}
