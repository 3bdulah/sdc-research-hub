"use client";

import { useCallback, useEffect, useState } from "react";
import type { MatchingResult, PollResponse } from "@/lib/matching";
import { useLocale } from "@/components/locale-provider";
import { seedConfig } from "@/lib/config";

type MatchingPayload = { mode: string; memberCount: number; result: MatchingResult; members?: PollResponse[]; leaderApproved: boolean; deputyApproved: boolean; swapWindowEnd?: string };

function explainMatch(value: string, en: boolean) {
  if (!en) return value;
  const axis = value.match(/في (a[123])/i)?.[1] ?? "";
  if (value.includes("رئيس المجموعة اختير")) return "Group lead selected for leadership interest and thread-writing ability.";
  if (value.includes("المجموعة تحتاج")) return "This group still needs members.";
  if (value.includes("المطلوب 30")) return `${value.match(/يوجد (\d+)/)?.[1] ?? "Some"} respondents are available for the pair track; 30 are needed.`;
  if (value.includes("تعذر إكمال ثنائي")) return `Could not complete a pair for axis ${axis}.`;
  if (value.includes("لا توجد خبرة ترجمة")) return `No member with translation experience is available for axis ${axis}.`;
  if (value.includes("مراجع لم يدخل مجموعة")) return `${value.match(/(\d+)/)?.[1] ?? "Some"} reviewer(s) could not be assigned to a group.`;
  if (value.includes("اختيار أول") || value.includes("اختيار بديل")) return `${value.includes("اختيار أول") ? "First-choice axis" : "Alternative-choice axis"} · ${value.includes("خبرة ترجمة موجودة") ? "Translation experience included" : "Additional support needed"}${value.includes("تفضيل الشريك تحقق") ? " · Preferred partner matched" : ""}.`;
  return "Review this matching note before confirming the assignment.";
}

export function MatchingStudio() {
  const { locale } = useLocale();
  const en = locale === "en";
  const t = (ar: string, english: string) => en ? english : ar;
  const [payload, setPayload] = useState<MatchingPayload | null>(null);
  const [csv, setCsv] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/matching");
      if (!response.ok) throw new Error();
      setPayload(await response.json() as MatchingPayload);
    } catch { setError(en ? "Could not load team data." : "تعذر تحميل بيانات الفريق."); }
  }, [en]);
  useEffect(() => { void load(); }, [load]);

  async function importCsv() {
    setError(""); setMessage(""); setLoading(true);
    try {
      const response = await fetch("/api/matching", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ csv }) });
      const data = await response.json() as MatchingPayload;
      if (!response.ok) throw new Error();
      setPayload(data); setCsv("");
      setMessage(t("حُللت القائمة محليًا. الاقتراح يحتاج مراجعة بشرية قبل اعتماده.", "Roster analyzed locally. Review the suggested assignments before approving them."));
    } catch { setError(t("تعذر تحليل القائمة. تحقق من تنسيق CSV ومن وجود معرّف واسم وبريد لكل عضو.", "Could not parse the roster. Check the CSV format and ensure each member has an ID, name, and email.")); }
    finally { setLoading(false); }
  }

  async function approve(role: "leader" | "deputy") {
    if (!payload) return;
    setError(""); setLoading(true);
    try {
      const response = await fetch("/api/matching", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ [role === "leader" ? "leaderApproved" : "deputyApproved"]: true }) });
      if (!response.ok) throw new Error();
      const data = await response.json() as MatchingPayload;
      setPayload((current) => current ? { ...current, ...data } : data);
      setMessage(t("سُجل الاعتماد المحلي.", "Approval recorded in this local workspace."));
    } catch { setError(t("تعذر تسجيل الاعتماد.", "Could not record approval.")); }
    finally { setLoading(false); }
  }

  const sections: Array<{ title: string; entries: Array<{ id: string; detail: string; note: string }> }> = [
    { title: t("الثنائيات والمحاور", "Pairs and research axes"), entries: payload?.result.pairs.map((pair) => ({ id: pair.id, detail: `${en ? seedConfig.axes.find((axis) => axis.id === pair.axisId)?.nameEn : seedConfig.axes.find((axis) => axis.id === pair.axisId)?.nameAr ?? pair.axisId} · ${pair.memberIds.join(" + ")}`, note: explainMatch(pair.explanation, en) })) ?? [] },
    { title: t("مجموعات المراجعة", "Review groups"), entries: payload?.result.reviewGroups.map((group) => ({ id: group.id, detail: `${t("الرئيس", "Lead")}: ${group.headId} · ${group.memberIds.join(", ")}`, note: explainMatch(group.explanation, en) })) ?? [] },
  ];

  return <div className="space-y-5" dir={en ? "ltr" : "rtl"}>
    <section className="rounded-2xl border border-ink/10 bg-white p-6 shadow-sm">
      <p className="eyebrow">{t("إعداد الفريق", "TEAM SETUP")}</p>
      <h2 className="mt-2 text-xl font-bold">{t("مطابقة الأعضاء حسب اختيارهم وخبرتهم", "Match members by preference and experience")}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/65">{t("توزيع مقترح قابل للمراجعة، وليس قرارًا تلقائيًا. استخدم ملف الاستبيان المعتمد، ثم راجع التوزيع قبل إعلان الفرق. لا تُرسل بيانات الأعضاء إلى خدمة خارجية.", "Assignments are suggestions, not automatic decisions. Use the approved poll export, then review the result before announcing teams. Member data is processed locally and is not sent to an external service.")}</p>
      <details className="mt-5 rounded-xl bg-sand p-4"><summary className="cursor-pointer font-semibold">{t("استيراد ملف الاستبيان (CSV)", "Import poll responses (CSV)")}</summary>
        <p className="mt-2 text-xs leading-6 text-ink/60">{t("اختر الملف المعتمد فقط. يُحفظ في قاعدة البيانات المحلية المستثناة من Git؛ لا تلصق بيانات أعضاء في تذاكر أو سجلات عامة.", "Use only the approved export. It is stored in the local, Git-ignored database; do not paste member information into public tickets or logs.")}</p>
        <textarea className="mt-3 min-h-28 w-full rounded-lg border border-ink/15 bg-white p-3 font-mono text-xs" aria-label={t("محتوى CSV", "CSV content")} placeholder="id,name,email,axisRanking,trackPreference,sectors,..." value={csv} onChange={(event) => setCsv(event.target.value)} />
        <button type="button" className="mt-3 rounded-lg bg-teal px-4 py-2 text-sm text-white disabled:opacity-50" disabled={!csv.trim() || loading || payload?.mode !== "private-local"} onClick={() => void importCsv()}>{loading ? t("جارٍ التحليل…", "Analyzing…") : t("تحليل محلي", "Analyze locally")}</button>
        {payload?.mode !== "private-local" && <p className="mt-2 text-xs text-amber-800">{t("استيراد بيانات الأعضاء متاح في الوضع الخاص فقط.", "Member imports are available in private mode only.")}</p>}
      </details>
      {error && <p className="mt-3 rounded-lg bg-coral/10 p-3 text-sm text-coral" role="alert">{error}</p>}
      {message && <p className="mt-3 rounded-lg bg-teal/10 p-3 text-sm text-teal" role="status">{message}</p>}
    </section>

    {!payload ? <p className="rounded-xl bg-white p-5 text-sm text-ink/65">{t("جارٍ تحميل حالة الفريق…", "Loading team status…")}</p> : payload.memberCount === 0 ? <section className="rounded-2xl border border-dashed border-ink/20 bg-white p-6"><h3 className="font-semibold">{t("لا توجد قائمة أعضاء محمّلة", "No member roster loaded")}</h3><p className="mt-2 text-sm text-ink/65">{t("بعد اعتماد الاستبيان، استورده أعلاه لاقتراح 15 ثنائيًا على ثلاثة محاور و4 مجموعات مراجعة بأحجام 5 / 5 / 4 / 4.", "Once the poll is approved, import it above to propose 15 pairs across three axes and four review groups sized 5 / 5 / 4 / 4.")}</p></section> : <>
      <section className="grid gap-3 sm:grid-cols-3">{[[t("أعضاء الاستبيان", "Poll respondents"), payload.memberCount], [t("الثنائيات المقترحة", "Suggested pairs"), payload.result.pairs.length], [t("مجموعات المراجعة", "Review groups"), payload.result.reviewGroups.length]].map(([label, value]) => <article className="rounded-xl border border-ink/10 bg-white p-4" key={String(label)}><p className="text-xs text-ink/60">{label}</p><strong className="mt-1 block text-2xl text-teal">{value}</strong></article>)}</section>
      {payload.result.warnings.length > 0 && <section className="rounded-xl bg-amber-100 p-4 text-sm text-amber-900"><h3 className="font-semibold">{t("تحتاج مراجعة", "Needs attention")}</h3><ul className="mt-2 list-disc space-y-1 ps-5">{payload.result.warnings.map((warning) => <li key={warning}>{explainMatch(warning, en)}</li>)}</ul></section>}
      <div className="grid gap-5 lg:grid-cols-2">{sections.map(({ title, entries }) => <section className="rounded-2xl border border-ink/10 bg-white p-5" key={title}><h3 className="font-semibold">{title}</h3><div className="mt-3 space-y-2">{entries.map((entry) => <article className="rounded-lg bg-sand p-3" key={entry.id}><strong className="text-sm">{entry.id}</strong><p className="mt-1 text-xs">{entry.detail}</p><p className="mt-1 text-xs text-ink/55">{entry.note}</p></article>)}</div></section>)}</div>
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink/10 bg-white p-5"><div className="me-auto"><h3 className="font-semibold">{t("اعتماد التوزيع", "Approve assignments")}</h3><p className="mt-1 text-xs text-ink/60">{t("لا تعلن التشكيل قبل مراجعة التوازن وتوثيق أي تعديل.", "Do not announce teams until the balance is reviewed and changes are documented.")}</p></div><button type="button" className="rounded-lg bg-teal px-3 py-2 text-sm text-white disabled:opacity-50" disabled={loading || payload.mode !== "private-local" || payload.leaderApproved} onClick={() => void approve("leader")}>{payload.leaderApproved ? t("اعتماد القائد مسجل", "Lead approved") : t("اعتماد القائد", "Lead approval")}</button><button type="button" className="rounded-lg bg-teal px-3 py-2 text-sm text-white disabled:opacity-50" disabled={loading || payload.mode !== "private-local" || payload.deputyApproved} onClick={() => void approve("deputy")}>{payload.deputyApproved ? t("اعتماد النائبة مسجل", "Deputy approved") : t("اعتماد النائبة", "Deputy approval")}</button>{payload.swapWindowEnd && <span className="text-xs text-ink/60">{t("نافذة التبديل حتى", "Swap window ends")}: {new Date(payload.swapWindowEnd).toLocaleDateString(en ? "en-US" : "ar-SA")}</span>}</section>
    </>}
  </div>;
}
