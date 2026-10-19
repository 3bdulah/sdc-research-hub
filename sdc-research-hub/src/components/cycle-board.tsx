"use client";

import { useState } from "react";
import { escalationFor, overdueHours, type PaperBoardRow } from "@/lib/cycle";
import type { FileStatus } from "@/lib/demo-data";

const statuses: FileStatus[] = ["not_started", "drafting", "submitted", "in_review", "changes_requested", "approved"];
const statusLabels: Record<FileStatus, string> = { not_started: "لم يبدأ", drafting: "مسودة", submitted: "مسلم", in_review: "قيد المراجعة", changes_requested: "تعديلات مطلوبة", approved: "معتمد" };
const escalationLabels = { none: "ضمن الوقت", coordinator: "تصعيد لمنسق المحور", leader_deputy: "تصعيد للقائد والنائبة" };

type StoredPaper = PaperBoardRow;

function withEscalation(paper: StoredPaper): StoredPaper {
  const hours = overdueHours(paper.dueDate);
  return { ...paper, overdueHours: hours, escalation: escalationFor(hours, paper.translation === "changes_requested") };
}

export function CycleBoard({ initialBoard }: { initialBoard: StoredPaper[] }) {
  const [papers, setPapers] = useState(initialBoard.map(withEscalation));
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function updateStatus(paperId: string, kind: "translation" | "summary", status: FileStatus) {
    setSaving(`${paperId}-${kind}`);
    try { setError(""); const response = await fetch("/api/cycle", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ paperId, kind, status }) }); const data = await response.json() as { papers: StoredPaper[] }; if (!response.ok) throw new Error("تعذر حفظ الحالة"); setPapers(data.papers.map(withEscalation)); }
    catch { setError("تعذر حفظ الحالة. تحقق من اتصال قاعدة البيانات ثم حاول مرة أخرى."); }
    finally { setSaving(null); }
  }
  return <div className="mt-6 overflow-x-auto">{error && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-coral" role="alert">{error}</p>}{papers.length === 0 ? <p className="rounded-xl bg-sand p-6 text-center text-sm text-ink/65">لا توجد أبحاث في هذه الدورة بعد.</p> : <table className="w-full min-w-[1000px] text-right text-sm"><caption className="sr-only">حالات ترجمة وتلخيص أبحاث الدورة</caption><thead><tr className="border-b border-ink/10 text-ink/55"><th scope="col" className="pb-3 font-medium">البحث / القطاع</th><th scope="col" className="pb-3 font-medium">الترجمة الكاملة</th><th scope="col" className="pb-3 font-medium">الملخص</th><th scope="col" className="pb-3 font-medium">التسليم</th><th scope="col" className="pb-3 font-medium">الحالة</th></tr></thead><tbody>{papers.map((paper) => <tr className="border-b border-ink/5 last:border-0" key={paper.id}><td className="py-4"><p className="font-medium">{paper.titleAr}</p><p className="text-xs text-ink/55">المحور {paper.axis.slice(1)} · {paper.sector} · الثنائي {paper.pair}</p></td><td className="py-4"><label className="sr-only" htmlFor={`${paper.id}-translation`}>حالة ترجمة {paper.titleAr}</label><select id={`${paper.id}-translation`} className="rounded-lg border border-ink/10 bg-sand px-2 py-1 text-xs" value={paper.translation} disabled={saving === `${paper.id}-translation`} onChange={(event) => void updateStatus(paper.id, "translation", event.target.value as FileStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td><td className="py-4"><label className="sr-only" htmlFor={`${paper.id}-summary`}>حالة ملخص {paper.titleAr}</label><select id={`${paper.id}-summary`} className="rounded-lg border border-ink/10 bg-sand px-2 py-1 text-xs" value={paper.summary} disabled={saving === `${paper.id}-summary`} onChange={(event) => void updateStatus(paper.id, "summary", event.target.value as FileStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td><td className="py-4 font-mono text-xs" dir="ltr">{paper.dueDate}</td><td className="py-4"><span className={`rounded-full px-3 py-1 text-xs ${paper.complete ? "bg-teal/10 text-teal" : paper.escalation === "none" ? "bg-amber-100 text-amber-800" : "bg-coral/10 text-coral"}`}>{paper.complete ? "مكتمل" : escalationLabels[paper.escalation]}</span></td></tr>)}</tbody></table>}</div>;
}
