"use client";
import { useState } from "react";
export function LocaleSwitcher() { const [locale, setLocale] = useState<"ar" | "en">("ar"); return <button type="button" className="rounded-full border border-ink/15 bg-white px-3 py-1.5 text-sm" onClick={() => setLocale(locale === "ar" ? "en" : "ar")} aria-label="تبديل اللغة">{locale === "ar" ? "English" : "العربية"}</button>; }
