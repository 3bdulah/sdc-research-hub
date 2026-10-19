"use client";

import { useEffect, useMemo, useState } from "react";
import type { PaperBoardRow } from "@/lib/cycle";
import { useLocale } from "@/components/locale-provider";

type KPI = { id: string; nameAr: string; target: string; dimension: string };
const labels: Record<string, [string, string]> = {
  "completed-papers": ["أبحاث مكتملة بملفيها", "Papers complete with both files"], threads: ["ثريدات منشورة", "Threads published"], "on-time": ["التسليم في الموعد", "On-time delivery"], reviewed: ["أبحاث مراجعة قبل النشر", "Papers reviewed before release"], unverified: ["مصادر غير موثقة", "Unverified sources"], "first-review": ["القبول من أول مراجعة", "Accepted on first review"], licensed: ["أبحاث برخصة موثقة", "Papers with verified reuse rights"], "digest-reads": ["قراءات الملخص الشهري", "Monthly digest reads"], "thread-engagement": ["تفاعل الثريدات", "Thread engagement"], retention: ["استمرار الأعضاء", "Member retention"], satisfaction: ["رضا الأعضاء", "Member satisfaction"], "volunteer-hours": ["توثيق الساعات التطوعية", "Volunteer hours recorded"],
};
const targetsEn: Record<string, string> = { "completed-papers": "15 / month", threads: "4 / month", "on-time": "90%+", reviewed: "100%", unverified: "0", "first-review": "70%+", licensed: "100%", "digest-reads": "Baseline in cycle 1", "thread-engagement": "Baseline in cycle 1", retention: "85%+", satisfaction: "4 / 5+", "volunteer-hours": "100%" };
const dimensions: Record<string, [string, string]> = { production: ["الإنتاج", "Production"], quality: ["الجودة", "Quality"], impact: ["الأثر", "Impact"], team: ["الفريق", "Team"] };

export function KpiPlanPanel({ papers }: { papers: PaperBoardRow[] }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const t = (ar: string, english: string) => en ? english : ar;
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [month, setMonth] = useState("2026-11");
  const [report, setReport] = useState("");
  useEffect(() => { fetch("/api/plan").then((response) => response.json()).then((data: { config?: { kpis?: KPI[] } }) => setKpis(data.config?.kpis ?? [])).catch(() => setKpis([])); }, []);
  const actuals = useMemo<Record<string, number | null>>(() => ({
    "completed-papers": papers.filter((paper) => paper.complete).length,
    licensed: papers.filter((paper) => paper.license === "allowed").length,
    reviewed: null, threads: null, "on-time": null, unverified: null, "first-review": null, "digest-reads": null, "thread-engagement": null, retention: null, satisfaction: null, "volunteer-hours": null,
  }), [papers]);

  function makeReport() {
    const heading = en ? `# Scientific Research Team — ${month} report` : `# التقرير الشهري لفريق البحث العلمي — ${month}`;
    const rows = kpis.map((item) => {
      const name = (labels[item.id] ?? [item.nameAr, item.nameAr])[en ? 1 : 0];
      const value = actuals[item.id];
      const shown = value === null || value === undefined ? t("غير متاح — لا يُسجل في التطبيق بعد", "Not tracked in the app yet") : String(value);
      const target = en ? targetsEn[item.id] ?? item.target : item.target;
      return `- ${name}: ${shown} (${t("المستهدف", "target")}: ${target})`;
    }).join("\n");
    setReport(`${heading}\n\n${t("مسودة — للمراجعة البشرية", "DRAFT — human review required")}\n\n${rows}\n\n${t("الأبحاث لا تُعد مكتملة إلا بعد اعتماد الترجمة والملخص كلٍ على حدة.", "A paper is complete only after its translation and summary are approved separately.")}\n`);
  }
  function downloadReport() {
    if (!report) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([report], { type: "text/markdown;charset=utf-8" }));
    link.download = `sdc-research-report-${month}.md`; link.click(); URL.revokeObjectURL(link.href);
  }

  return <div className="space-y-5" dir={en ? "ltr" : "rtl"}>
    <section className="rounded-2xl border border-ink/10 bg-white p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{t("مؤشرات الخطة", "PLAN TARGETS")}</p><h2 className="mt-2 text-xl font-bold">{t("المستهدف والإنجاز المسجل", "Targets and recorded progress")}</h2></div><label className="grid gap-1 text-xs text-ink/60">{t("شهر التقرير", "Report month")}<input className="rounded-lg border border-ink/15 bg-white px-3 py-2 font-mono text-sm" type="month" value={month} onChange={(event) => setMonth(event.target.value)} /></label></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{kpis.map((kpi) => { const value = actuals[kpi.id]; const measured = value !== null && value !== undefined; const total = kpi.id === "completed-papers" || kpi.id === "licensed" ? 15 : null; return <article className="rounded-xl bg-sand p-4" key={kpi.id}><p className="text-[10px] font-semibold uppercase tracking-wider text-ink/50">{(dimensions[kpi.dimension] ?? [kpi.dimension, kpi.dimension])[en ? 1 : 0]}</p><h3 className="mt-2 min-h-10 text-sm font-semibold">{(labels[kpi.id] ?? [kpi.nameAr, kpi.nameAr])[en ? 1 : 0]}</h3><p className="mt-2 text-xl font-bold text-teal">{measured ? `${value}${total === null ? "" : ` / ${total}`}` : <span className="text-sm text-ink/55">{t("غير متاح بعد", "Not tracked yet")}</span>}</p><p className="mt-1 text-xs text-ink/55">{t("المستهدف", "Target")}: {en ? targetsEn[kpi.id] ?? kpi.target : kpi.target}</p></article>; })}</div>
      <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-6 text-amber-900">{t("تُعرض أرقام الإنجاز من سجلات الأبحاث الفعلية فقط. مؤشرات الثريدات والمراجعة والالتزام والأثر والفريق غير متصلة بالتطبيق بعد، لذلك لا تُعرض كأصفار أو نسب مفترضة.", "Progress is calculated only from actual paper records. Thread, review, timeliness, impact, and team indicators are not connected yet, so they are shown as untracked—not as assumed zeros or percentages.")}</p>
    </section>
    <section className="rounded-2xl border border-ink/10 bg-white p-6"><p className="eyebrow">{t("تقرير الدورة", "CYCLE REPORT")}</p><h2 className="mt-2 text-xl font-bold">{t("ملخص قابل للتنزيل", "Downloadable summary")}</h2><p className="mt-2 text-sm text-ink/60">{t("ينشئ تقريرًا من السجلات المتاحة، ويعلّم البيانات غير المتصلة بوضوح.", "Generates a report from available records and clearly marks untracked indicators.")}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className="rounded-lg bg-teal px-4 py-2 text-sm text-white" onClick={makeReport}>{t("إنشاء مسودة التقرير", "Create report draft")}</button><button type="button" className="rounded-lg bg-sand px-4 py-2 text-sm disabled:opacity-50" onClick={downloadReport} disabled={!report}>{t("تنزيل Markdown", "Download Markdown")}</button></div>{report && <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-sand p-4 text-xs leading-6" dir={en ? "ltr" : "rtl"}>{report}</pre>}</section>
  </div>;
}
