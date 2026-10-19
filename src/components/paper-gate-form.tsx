"use client";

import { useCallback, useEffect, useState } from "react";
import type { PaperGateResult } from "@/lib/paper-gate";
import { useLocale } from "@/components/locale-provider";

const verdictLabels = {
  allowed: ["مسموح مبدئيًا", "Eligible to proceed"],
  needs_permission: ["يتطلب إذنًا كتابيًا", "Written permission required"],
  reject: ["غير مؤهل حاليًا", "Not eligible"],
} as const;
const gateCopy: Record<string, string> = {
  "البحث أقدم من 18 شهرًا.": "This paper is older than 18 months.",
  "تاريخ النشر غير معروف.": "The publication date could not be verified.",
  "الرخصة تسمح بالترجمة وإعادة التوزيع.": "The listed license permits translation and redistribution.",
  "الرخصة غير مفتوحة بما يكفي؛ يلزم إذن كتابي من المؤلف.": "The license may not permit reuse; obtain written permission from the author.",
  "الرخصة غير معروفة؛ يجب رفض البحث حتى التحقق يدويًا.": "The license is unknown. Do not proceed until it has been verified manually.",
  "عدد الصفحات أكبر من 25؛ يلزم تنبيه الفريق قبل الاعتماد.": "The paper exceeds 25 pages; review workload before approval.",
};

type Proposal = { id: string; pairId: string; url: string; title?: string; publishedDate?: string; sector: string; licenseVerdict: string; selected: boolean };
const proposalVerdicts: Record<string, [string, string]> = {
  allowed: ["مسموح مبدئيًا", "Preliminarily eligible"],
  needs_permission: ["يتطلب إذنًا", "Permission required"],
  reject: ["غير مؤهل", "Not eligible"],
};

export function PaperGateForm() {
  const { locale } = useLocale();
  const en = locale === "en";
  const [identifier, setIdentifier] = useState("");
  const [pairId, setPairId] = useState("");
  const [sector, setSector] = useState("");
  const [permissionNote, setPermissionNote] = useState("");
  const [permissionNoteDate, setPermissionNoteDate] = useState("");
  const [result, setResult] = useState<PaperGateResult | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState<Proposal[]>([]);

  const loadProposals = useCallback(async () => {
    try {
      const response = await fetch("/api/proposals");
      if (!response.ok) throw new Error();
      const data = await response.json() as { proposals: Proposal[] };
      setProposals(data.proposals);
    } catch { setError(en ? "Could not load saved proposals." : "تعذر تحميل الاقتراحات المحفوظة."); }
  }, [en]);

  useEffect(() => { void loadProposals(); }, [loadProposals]);

  async function inspect() {
    setLoading(true); setError(""); setSaved(""); setResult(null);
    try {
      const response = await fetch("/api/paper-gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier }) });
      const data = await response.json() as PaperGateResult;
      if (!response.ok) throw new Error(en ? "Paper check failed. Verify the DOI or arXiv link and try again." : "تعذر فحص البحث. تحقق من رابط DOI أو arXiv وحاول مرة أخرى.");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : en ? "Paper check failed." : "تعذر فحص البحث."); }
    finally { setLoading(false); }
  }

  async function save() {
    if (!result || !pairId.trim() || !sector.trim()) return;
    setLoading(true); setError(""); setSaved("");
    try {
      const response = await fetch("/api/proposals", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ pairId, sector, url: result.metadata.canonicalUrl, title: result.metadata.title, authors: result.metadata.authors.join(", "), publishedDate: result.metadata.publishedDate, permissionNote, permissionNoteDate, licenseVerdict: result.verdict, selected: false }) });
      if (!response.ok) throw new Error(en ? "Could not save the proposal. Check the required permission record and local database." : "تعذر حفظ الاقتراح. تحقق من بيانات الإذن المطلوبة وقاعدة البيانات المحلية.");
      setSaved(en ? "Proposal saved. It still needs human approval before entering the cycle." : "حُفظ الاقتراح؛ ويحتاج اعتمادًا بشريًا قبل إدخاله في الدورة.");
      await loadProposals();
    } catch (caught) { setError(caught instanceof Error ? caught.message : en ? "Could not save the proposal. Check the local database." : "تعذر حفظ الاقتراح. تحقق من قاعدة البيانات المحلية."); }
    finally { setLoading(false); }
  }

  const text = (ar: string, english: string) => en ? english : ar;
  return <div className="space-y-4" dir={en ? "ltr" : "rtl"}>
    <p className="max-w-3xl text-sm leading-7 text-ink/65">{text("تحقق من حداثة البحث وحجمه ورخصة استخدامه قبل اعتماده. نتيجة الأداة فحص أولي وليست استشارة قانونية؛ لا تبدأ الترجمة الكاملة دون رخصة تسمح بها أو إذن كتابي موثق.", "Check a paper’s recency, length, and reuse license before approval. This is a preliminary screening, not legal advice. Do not begin a full translation without a license that permits it or documented written permission.")}</p>
    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
      <label className="sr-only" htmlFor="paper-identifier">{text("رابط البحث أو DOI", "Paper URL or DOI")}</label>
      <input id="paper-identifier" className="min-w-0 rounded-xl border border-ink/15 px-4 py-3" dir="ltr" placeholder="https://arxiv.org/abs/... · DOI" value={identifier} onChange={(event) => setIdentifier(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void inspect(); }} />
      <button type="button" className="rounded-xl bg-teal px-5 py-3 font-medium text-white disabled:opacity-50" disabled={loading || !identifier.trim()} onClick={() => void inspect()}>{loading ? text("جارٍ الفحص…", "Checking…") : text("افحص المصدر", "Check source")}</button>
    </div>
    {error && <p className="rounded-xl bg-coral/10 p-3 text-sm text-coral" role="alert">{error}</p>}
    {saved && <p className="rounded-xl bg-teal/10 p-3 text-sm text-teal" role="status">{saved}</p>}
    {result && <div className="rounded-2xl bg-sand p-5" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs text-ink/55">{text("المصدر", "Source")}: {result.metadata.source === "openalex" ? "OpenAlex" : "arXiv"}</p><h3 className="mt-1 text-lg font-bold">{result.metadata.title}</h3><p className="mt-1 text-sm text-ink/65">{result.metadata.authors.join(en ? ", " : "، ") || text("المؤلفون غير متاحين", "Authors unavailable")}</p>{result.metadata.venue && <p className="mt-1 text-xs text-ink/55">{result.metadata.venue}</p>}</div><span className={`rounded-full px-3 py-1 text-sm font-medium ${result.verdict === "allowed" ? "bg-teal/10 text-teal" : result.verdict === "reject" ? "bg-coral/10 text-coral" : "bg-amber-100 text-amber-800"}`}>{verdictLabels[result.verdict][en ? 1 : 0]}</span></div>
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><p>{text("تاريخ النشر", "Published")}: <strong>{result.metadata.publishedDate ?? text("غير معروف", "Unknown")}</strong></p><p>{text("الصفحات", "Pages")}: <strong>{result.metadata.pageCount ?? text("غير معروف", "Unknown")}</strong></p><p>{text("الرخصة", "License")}: <strong>{result.metadata.license ?? text("غير معروفة", "Unknown")}</strong></p></div>
      <ul className="mt-4 list-disc space-y-1 ps-5 text-sm">{result.reasons.map((reason) => <li key={reason}>{en ? gateCopy[reason] ?? "Review the source metadata before proceeding." : reason}</li>)}{result.warnings.map((warning) => <li className="text-amber-800" key={warning}>{en ? gateCopy[warning] ?? "Review the paper before approval." : warning}</li>)}</ul>
      {result.verdict !== "reject" && <div className="mt-5 space-y-3 border-t border-ink/10 pt-4"><h4 className="font-semibold">{text("حفظ الاقتراح للمراجعة", "Save proposal for review")}</h4><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-ink/65">{text("معرّف الثنائي المسؤول", "Assigned pair ID")}<input className="rounded-lg border border-ink/15 bg-white p-2 text-sm text-ink" dir="ltr" placeholder="pair-01" value={pairId} onChange={(event) => setPairId(event.target.value)} /></label><label className="grid gap-1 text-xs text-ink/65">{text("القطاع التطبيقي", "Application sector")}<input className="rounded-lg border border-ink/15 bg-white p-2 text-sm text-ink" placeholder={text("مثال: التعليم", "e.g. Education")} value={sector} onChange={(event) => setSector(event.target.value)} /></label></div>
        {result.verdict === "needs_permission" && <><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs text-ink/65">{text("مرجع الإذن الكتابي", "Written permission reference")}<textarea className="rounded-xl border border-ink/15 bg-white p-3 text-sm text-ink" placeholder={text("سجّل مرجعًا أو ملاحظة، ولا تضع بيانات حساسة هنا", "Record a reference; do not paste sensitive information")} value={permissionNote} onChange={(event) => setPermissionNote(event.target.value)} /></label><label className="grid gap-1 text-xs text-ink/65">{text("تاريخ الإذن", "Permission date")}<input className="rounded-xl border border-ink/15 bg-white p-3 text-sm text-ink" type="date" value={permissionNoteDate} onChange={(event) => setPermissionNoteDate(event.target.value)} /></label></div><p className="text-xs text-amber-800">{text("لا يُحفظ هذا الاقتراح إلا بعد توثيق مرجع الإذن وتاريخه.", "A permission-required proposal cannot be saved without a reference and date.")}</p></>}
        <button type="button" className="rounded-xl border border-teal px-4 py-2 text-sm font-medium text-teal disabled:opacity-50" disabled={loading || !pairId.trim() || !sector.trim() || (result.verdict === "needs_permission" && (!permissionNote.trim() || !permissionNoteDate))} onClick={() => void save()}>{text("حفظ كاقتراح غير معتمد", "Save unapproved proposal")}</button></div>}
    </div>}
    <section className="rounded-2xl border border-ink/10 bg-white p-5" aria-labelledby="saved-proposals-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 id="saved-proposals-heading" className="font-semibold">{text("الاقتراحات المحفوظة", "Saved proposals")}</h3><span className="text-xs text-ink/55">{text("لا تدخل الدورة قبل اعتمادها", "Not in the cycle until approved")}</span></div>
      {proposals.length === 0 ? <p className="mt-3 rounded-xl bg-sand p-4 text-sm text-ink/60">{text("لا توجد اقتراحات محفوظة بعد.", "No saved proposals yet.")}</p> : <ul className="mt-3 space-y-2">{proposals.map((proposal) => <li key={proposal.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand p-3"><div className="min-w-0"><strong className="block truncate text-sm">{proposal.title || proposal.url}</strong><span className="text-xs text-ink/60">{en ? `Pair ${proposal.pairId} · ${proposal.sector}` : `الثنائي ${proposal.pairId} · ${proposal.sector}`}{proposal.publishedDate ? ` · ${proposal.publishedDate}` : ""}</span></div><span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs">{(proposalVerdicts[proposal.licenseVerdict] ?? [proposal.licenseVerdict, proposal.licenseVerdict])[en ? 1 : 0]} · {text("غير معتمد", "Unapproved")}</span></li>)}</ul>}
    </section>
  </div>;
}
