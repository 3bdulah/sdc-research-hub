"use client";

import { useState } from "react";
import { escalationFor, overdueHours, type PaperBoardRow } from "@/lib/cycle";
import type { FileStatus } from "@/lib/demo-data";
import { useLocale } from "@/components/locale-provider";

const statuses: FileStatus[] = ["not_started", "drafting", "submitted", "in_review", "changes_requested", "approved"];
const statusLabels: Record<FileStatus, [string, string]> = { not_started: ["لم يبدأ", "Not started"], drafting: ["مسودة", "Draft"], submitted: ["مسلم", "Submitted"], in_review: ["قيد المراجعة", "In review"], changes_requested: ["تعديلات مطلوبة", "Changes requested"], approved: ["معتمد", "Approved"] };
const escalationLabels = { none: ["ضمن الوقت", "On track"], coordinator: ["تصعيد لمنسق المحور", "Escalate to axis coordinator"], leader_deputy: ["تصعيد للقائد والنائبة", "Escalate to team leads"] } as const;

type StoredPaper = PaperBoardRow;

function withEscalation(paper: StoredPaper): StoredPaper {
  const hours = overdueHours(paper.dueDate);
  return { ...paper, overdueHours: hours, escalation: escalationFor(hours, paper.translation === "changes_requested") };
}

export function CycleBoard({ initialBoard }: { initialBoard: StoredPaper[] }) {
  const { locale } = useLocale(); const en = locale === "en";
  const [papers, setPapers] = useState(initialBoard.map(withEscalation));
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function updateStatus(paperId: string, kind: "translation" | "summary", status: FileStatus) {
    setSaving(`${paperId}-${kind}`);
    try { setError(""); const response = await fetch("/api/cycle", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ paperId, kind, status }) }); const data = await response.json() as { papers: StoredPaper[] }; if (!response.ok) throw new Error(); setPapers(data.papers.map(withEscalation)); }
    catch { setError(en ? "Could not save the status. Check the database connection and try again." : "تعذر حفظ الحالة. تحقق من اتصال قاعدة البيانات ثم حاول مرة أخرى."); }
    finally { setSaving(null); }
  }
  return <div className="mt-6 overflow-x-auto" dir={en ? "ltr" : "rtl"}>{error && <p className="mb-3 rounded-xl bg-coral/10 p-3 text-sm text-coral" role="alert">{error}</p>}{papers.length === 0 ? <div className="rounded-xl bg-sand p-6 text-center text-sm text-ink/65"><strong className="block text-ink">{en ? "No papers in this cycle" : "لا توجد أبحاث في هذه الدورة"}</strong><span>{en ? "Start by checking a paper's source and reuse license above." : "ابدأ بفحص مصدر البحث وترخيص إعادة استخدامه أعلاه."}</span></div> : <table className={`w-full min-w-[1000px] text-sm ${en ? "text-left" : "text-right"}`}><caption className="sr-only">{en ? "Translation and summary status" : "حالات ترجمة وتلخيص أبحاث الدورة"}</caption><thead><tr className="border-b border-ink/10 text-ink/55">{(en ? ["Paper / sector", "Full translation", "Short summary", "Due date", "Progress"] : ["البحث / القطاع", "الترجمة الكاملة", "الملخص", "التسليم", "الحالة"]).map((label) => <th scope="col" className="pb-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody>{papers.map((paper) => <tr className="border-b border-ink/5 last:border-0" key={paper.id}><td className="py-4"><p className="font-medium">{paper.titleAr}</p><p className="text-xs text-ink/55">{en ? `Axis ${paper.axis.slice(1)} · ${paper.sector} · Pair ${paper.pair}` : `المحور ${paper.axis.slice(1)} · ${paper.sector} · الثنائي ${paper.pair}`}</p></td>{(["translation", "summary"] as const).map((kind) => <td className="py-4" key={kind}><label className="sr-only" htmlFor={`${paper.id}-${kind}`}>{en ? `${kind} status for ${paper.titleAr}` : `حالة ${kind === "translation" ? "ترجمة" : "ملخص"} ${paper.titleAr}`}</label><select id={`${paper.id}-${kind}`} className="rounded-lg border border-ink/10 bg-sand px-2 py-1 text-xs" value={paper[kind]} disabled={saving === `${paper.id}-${kind}`} onChange={(event) => void updateStatus(paper.id, kind, event.target.value as FileStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status][en ? 1 : 0]}</option>)}</select></td>)}<td className="py-4 font-mono text-xs" dir="ltr">{paper.dueDate}</td><td className="py-4"><span className={`rounded-full px-3 py-1 text-xs ${paper.complete ? "bg-teal/10 text-teal" : paper.escalation === "none" ? "bg-amber-100 text-amber-800" : "bg-coral/10 text-coral"}`}>{paper.complete ? (en ? "Complete" : "مكتمل") : escalationLabels[paper.escalation][en ? 1 : 0]}</span></td></tr>)}</tbody></table>}</div>;
}
