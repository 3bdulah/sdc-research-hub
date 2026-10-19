"use client";

import type { PaperBoardRow, CycleMilestone } from "@/lib/cycle";
import { useLocale } from "@/components/locale-provider";
import { buildYearCalendar } from "@/lib/calendar";
import { seedConfig } from "@/lib/config";

const milestoneLabels: Record<string, [string, string]> = {
  proposals: ["اقتراح البحث واعتماده", "Propose and approve papers"],
  checkpoint: ["نقطة متابعة منتصف الدورة", "Mid-cycle checkpoint"],
  "files-due": ["تسليم الترجمة والملخص", "Translation and summary due"],
  "reviews-due": ["اكتمال المراجعتين العلمية واللغوية", "Scientific and language reviews complete"],
  "changes-due": ["انتهاء تطبيق الملاحظات", "Revisions complete"],
  release: ["الاعتماد النهائي وإصدار الملخص", "Final approval and digest release"],
};

const pendingLabels: Record<string, [string, string]> = {
  "official-start-date": ["تثبيت تاريخ بداية الدورة", "Confirm the cycle start date"],
  "poll-wording": ["اعتماد صياغة الاستبيان وتوقيته", "Approve poll wording and timing"],
  "digest-template": ["اعتماد قالب الملخص والثريد", "Approve digest and thread templates"],
  "publishing-path": ["اعتماد قناة ومسار النشر", "Approve the publishing channel"],
  "activities-calendar": ["تنسيق تقويم الأنشطة ربع السنوي", "Coordinate the quarterly activities calendar"],
};

export function LeadershipCalendarPanel({ papers, milestones }: { papers: PaperBoardRow[]; milestones: CycleMilestone[] }) {
  const { locale } = useLocale();
  const en = locale === "en";
  const t = (ar: string, english: string) => en ? english : ar;
  const months = buildYearCalendar();
  const completed = papers.filter((paper) => paper.complete).length;
  const translations = papers.filter((paper) => paper.translation === "approved").length;
  const summaries = papers.filter((paper) => paper.summary === "approved").length;
  const pending = seedConfig.pendingApprovals.filter((item) => item.status === "waiting");

  return <div className="space-y-5" dir={en ? "ltr" : "rtl"}>
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <p className="eyebrow">{t("الدورة الشهرية", "MONTHLY CYCLE")}</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-xl font-bold">{t("خطة 28 يومًا + يومي احتياط", "28-day cycle + 2-day buffer")}</h2><p className="mt-1 text-sm text-ink/60">{t("المواعيد محسوبة من تاريخ البداية المخطط، وتُقدّم إذا وافقت عطلة نهاية الأسبوع.", "Dates are calculated from the planned start and move earlier when they land on the weekend.")}</p></div><span className="rounded-lg bg-sand px-3 py-2 font-mono text-sm" dir="ltr">{seedConfig.plan.cycleStart}</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{milestones.map((milestone) => <article className="rounded-xl bg-sand p-4" key={milestone.id}><div className="flex items-center justify-between gap-2"><span className="rounded-md bg-white px-2 py-1 font-mono text-xs" dir="ltr">{en ? `Day ${milestone.cycleDay}` : `اليوم ${milestone.cycleDay}`}</span><time className="font-mono text-xs text-ink/55" dir="ltr">{milestone.dueDate}</time></div><h3 className="mt-3 text-sm font-semibold">{(milestoneLabels[milestone.id] ?? [milestone.labelAr, milestone.labelAr])[en ? 1 : 0]}</h3>{milestone.shifted && <p className="mt-1 text-xs text-amber-800">{t(`قُدّم الموعد من ${milestone.rawDate} إلى يوم عمل سابق.`, `Moved earlier from ${milestone.rawDate} to the previous workday.`)}</p>}</article>)}</div>
      <p className="mt-4 border-t border-ink/10 pt-3 text-xs text-ink/60">{t("التسليم الرسمي يوم 28؛ اليومان 29 و30 للطوارئ والتأخير فقط.", "Release is due on day 28; days 29–30 are contingency time only.")}</p>
    </section>

    <section className="grid gap-3 sm:grid-cols-3">{[[t("أبحاث في الدورة", "Papers in cycle"), `${papers.length} / 15`], [t("ترجمات معتمدة", "Approved translations"), `${translations} / 15`], [t("ملخصات معتمدة", "Approved summaries"), `${summaries} / 15`]].map(([label, value]) => <article className="rounded-xl border border-ink/10 bg-white p-4" key={label}><p className="text-xs text-ink/60">{label}</p><strong className="mt-1 block text-2xl text-teal">{value}</strong><p className="mt-1 text-xs text-ink/55">{t("لا يكتمل البحث إلا باعتماد الملفين المنفصلين.", "A paper is complete only when both separate files are approved.")}</p></article>)}</section>
    <p className="-mt-2 text-xs text-ink/55">{t(`الأبحاث المكتملة: ${completed} من 15.`, `Completed papers: ${completed} of 15.`)}</p>

    <section className="rounded-2xl border border-ink/10 bg-white p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{t("مرجع الفريق", "TEAM REFERENCE")}</p><h2 className="mt-2 text-xl font-bold">{t("قرارات مطلوبة قبل الإطلاق", "Decisions needed before launch")}</h2></div><span className="text-xs text-ink/55">{t("حسب موجز الخطة · يلزم تأكيد الحالة", "From the planning brief · confirm current status")}</span></div><p className="mt-2 text-sm text-ink/60">{t("هذه عناصر معلّقة في ملف الخطة، وليست حالة موافقات حية داخل التطبيق.", "These items are marked pending in the planning brief; this is not a live approval tracker.")}</p><ul className="mt-4 grid gap-2 sm:grid-cols-2">{pending.map((item) => <li key={item.id} className="flex items-start gap-3 rounded-xl bg-sand p-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"/><span className="text-sm">{(pendingLabels[item.id] ?? [item.nameAr, item.nameAr])[en ? 1 : 0]}</span></li>)}</ul></section>

    <section className="rounded-2xl border border-ink/10 bg-white p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">{t("نوفمبر 2026 — أكتوبر 2027", "NOV 2026 — OCT 2027")}</p><h2 className="mt-2 text-xl font-bold">{t("موضوعات البحث حسب الشهر", "Monthly research themes")}</h2></div><p className="text-xs text-ink/55">{t("ثلاثة محاور بحثية · 15 بحثًا شهريًا", "Three research axes · 15 papers each month")}</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{months.map((month) => <article className="rounded-xl bg-sand p-4" key={month.month}><div className="flex items-center justify-between"><h3 className="font-bold">{en ? new Date(`${month.month}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }) : month.labelAr}</h3><span className="text-xs text-ink/55">{month.quarter}</span></div><ul className="mt-3 space-y-2">{month.topics[en ? "en" : "ar"].map((topic) => <li className="border-s-2 border-teal/30 ps-2 text-sm text-ink/75" key={topic}>{topic}</li>)}</ul></article>)}</div></section>
  </div>;
}
