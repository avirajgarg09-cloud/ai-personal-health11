import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VitalEdge — Offline-First Health Dashboard",
  description:
    "An offline-first personal health dashboard & clinical AI assistant: ambient scribe, prescription analyzer, report translator, and a contextual AI chat.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="text-emerald-950 antialiased">
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
