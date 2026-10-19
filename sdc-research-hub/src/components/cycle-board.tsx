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
  async function updateStatus(paperId: string, kind: "translation" | "summary", status: FileStatus) {
    setSaving(`${paperId}-${kind}`);
    try { const response = await fetch("/api/cycle", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ paperId, kind, status }) }); const data = await response.json() as { papers: StoredPaper[] }; if (!response.ok) throw new Error("تعذر حفظ الحالة"); setPapers(data.papers.map(withEscalation)); }
    finally { setSaving(null); }
  }
  return <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[1000px] text-right text-sm"><thead><tr className="border-b border-ink/10 text-ink/55"><th className="pb-3 font-medium">البحث / القطاع</th><th className="pb-3 font-medium">الترجمة الكاملة</th><th className="pb-3 font-medium">الملخص</th><th className="pb-3 font-medium">التسليم</th><th className="pb-3 font-medium">الحالة</th></tr></thead><tbody>{papers.map((paper) => <tr className="border-b border-ink/5 last:border-0" key={paper.id}><td className="py-4"><p className="font-medium">{paper.titleAr}</p><p className="text-xs text-ink/55">المحور {paper.axis.slice(1)} · {paper.sector} · الثنائي {paper.pair}</p></td><td className="py-4"><select className="rounded-lg border border-ink/10 bg-sand px-2 py-1 text-xs" value={paper.translation} disabled={saving === `${paper.id}-translation`} onChange={(event) => updateStatus(paper.id, "translation", event.target.value as FileStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td><td className="py-4"><select className="rounded-lg border border-ink/10 bg-sand px-2 py-1 text-xs" value={paper.summary} disabled={saving === `${paper.id}-summary`} onChange={(event) => updateStatus(paper.id, "summary", event.target.value as FileStatus)}>{statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select></td><td className="py-4 font-mono text-xs" dir="ltr">{paper.dueDate}</td><td className="py-4"><span className={`rounded-full px-3 py-1 text-xs ${paper.complete ? "bg-teal/10 text-teal" : paper.escalation === "none" ? "bg-amber-100 text-amber-800" : "bg-coral/10 text-coral"}`}>{paper.complete ? "مكتمل" : escalationLabels[paper.escalation]}</span></td></tr>)}</tbody></table></div>;
}
