"use client";

import { useEffect, useState } from "react";

export type Locale = "ar" | "en";

export function LocaleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocale] = useState<Locale>("ar");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sdc-locale");
      if (stored === "ar" || stored === "en") setLocale(stored);
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const title = locale === "ar" ? "مركز أبحاث SDC" : "SDC Research Hub";
    const description = locale === "ar" ? "لوحة عمل البحث العلمي في مجتمع المطورين السعوديين" : "Research workflow for the Saudi Developers Community Scientific Research team.";
    const applyLocaleMetadata = () => {
      document.documentElement.lang = locale;
      document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
      document.documentElement.dataset.locale = locale;
      if (document.title !== title) document.title = title;
      const descriptionTag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (descriptionTag && descriptionTag.content !== description) descriptionTag.content = description;
    };
    applyLocaleMetadata();
    const observer = new MutationObserver(applyLocaleMetadata);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true, attributes: true });
    try { window.localStorage.setItem("sdc-locale", locale); } catch { /* Storage may be disabled; the current session still works. */ }
    return () => observer.disconnect();
  }, [initialized, locale]);

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

import { createContext, useContext } from "react";
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void }>({ locale: "ar", setLocale: () => undefined });
export function useLocale() { return useContext(LocaleContext); }
