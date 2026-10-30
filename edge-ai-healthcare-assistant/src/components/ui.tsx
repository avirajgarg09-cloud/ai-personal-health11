import type { ReactNode } from "react";

export function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`glass-panel rounded-3xl p-5 sm:p-6 ${className}`}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">{eyebrow}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-emerald-700/80">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusPill({ status }: { status: "normal" | "watch" | "high" | "low" | undefined }) {
  const map: Record<string, string> = {
    normal: "bg-emerald-100 text-emerald-700",
    watch: "bg-amber-100 text-amber-700",
    high: "bg-rose-100 text-rose-700",
    low: "bg-sky-100 text-sky-700",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${map[status ?? "normal"]}`}>
      {(status ?? "normal").toUpperCase()}
    </span>
  );
}
