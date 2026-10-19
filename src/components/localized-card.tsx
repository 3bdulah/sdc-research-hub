"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/locale-provider";

export function LocalizedCard({ index, titleAr, titleEn, children }: { index: string; titleAr: string; titleEn: string; children: ReactNode }) {
  const { locale } = useLocale();
  const en = locale === "en";
  return <section className="surface-card"><div className="section-heading"><div><p className="eyebrow">{index} / {en ? "WORKFLOW" : "سير العمل"}</p><h2>{en ? titleEn : titleAr}</h2></div></div>{children}</section>;
}
