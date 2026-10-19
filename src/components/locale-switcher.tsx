"use client";
import { useLocale } from "@/components/locale-provider";
export function LocaleSwitcher() { const { locale, setLocale } = useLocale(); const nextLocale = locale === "ar" ? "en" : "ar"; return <button type="button" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm" onClick={() => setLocale(nextLocale)} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"} aria-pressed={locale === "en"}>{locale === "ar" ? "English" : "العربية"}</button>; }
