"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "es", label: "Español (Spanish)" },
] as const;

export type LangCode = (typeof LANGUAGES)[number]["code"];

const DICT: Record<LangCode, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    scribe: "Clinical Scribe",
    prescriptions: "Prescriptions",
    reports: "Reports",
    appointments: "Appointments",
    settings: "Settings",
    support: "Help & Support",
    welcome: "Welcome back",
    online: "Online",
    offline: "Offline mode",
    allSynced: "All records synced",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    scribe: "क्लिनिकल स्क्राइब",
    prescriptions: "पर्चे",
    reports: "रिपोर्ट्स",
    appointments: "अपॉइंटमेंट्स",
    settings: "सेटिंग्स",
    support: "सहायता",
    welcome: "वापसी पर स्वागत है",
    online: "ऑनलाइन",
    offline: "ऑफ़लाइन मोड",
    allSynced: "सभी रिकॉर्ड सिंक हो गए",
  },
  es: {
    dashboard: "Panel",
    scribe: "Asistente Clínico",
    prescriptions: "Recetas",
    reports: "Informes",
    appointments: "Citas",
    settings: "Ajustes",
    support: "Ayuda y Soporte",
    welcome: "Bienvenido de nuevo",
    online: "En línea",
    offline: "Modo sin conexión",
    allSynced: "Todo sincronizado",
  },
};

type LanguageContextValue = {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem("vitaledge.lang") as LangCode | null;
    if (stored && DICT[stored]) setLangState(stored);
  }, []);

  const setLang = (next: LangCode) => {
    setLangState(next);
    window.localStorage.setItem("vitaledge.lang", next);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: (key: string) => DICT[lang]?.[key] ?? DICT.en[key] ?? key,
    }),
    [lang],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
