"use client";

import { useState } from "react";
import type { PaperGateResult } from "@/lib/paper-gate";

const verdictLabels = { allowed: "مسموح", needs_permission: "يحتاج إذنًا كتابيًا", reject: "مرفوض" };

export function PaperGateForm() {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<PaperGateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function inspect() {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await fetch("/api/paper-gate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ identifier }) });
      const data = await response.json() as PaperGateResult & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "تعذر الفحص");
      setResult(data);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "تعذر الفحص"); }
    finally { setLoading(false); }
  }
  return <div className="space-y-4"><div className="flex flex-col gap-3 sm:flex-row"><input className="min-w-0 flex-1 rounded-xl border border-ink/15 px-4 py-3" dir="ltr" placeholder="https://arxiv.org/abs/... أو DOI" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /><button className="rounded-xl bg-teal px-5 py-3 font-medium text-white disabled:opacity-50" disabled={loading || !identifier.trim()} onClick={inspect}>{loading ? "جارٍ الفحص..." : "افحص البحث"}</button></div>{error && <p className="rounded-xl bg-coral/10 p-3 text-sm text-coral">{error}</p>}{result && <div className="rounded-2xl bg-sand p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-ink/55">المصدر: {result.metadata.source === "openalex" ? "OpenAlex" : "arXiv"}</p><h3 className="mt-1 text-lg font-bold">{result.metadata.title}</h3><p className="mt-1 text-sm text-ink/65">{result.metadata.authors.join("، ") || "المؤلفون غير متاحين"}</p></div><span className={`rounded-full px-3 py-1 text-sm font-medium ${result.verdict === "allowed" ? "bg-teal/10 text-teal" : result.verdict === "reject" ? "bg-coral/10 text-coral" : "bg-amber-100 text-amber-800"}`}>{verdictLabels[result.verdict]}</span></div><div className="mt-4 grid gap-2 text-sm sm:grid-cols-3"><p>النشر: <strong>{result.metadata.publishedDate ?? "غير معروف"}</strong></p><p>الصفحات: <strong>{result.metadata.pageCount ?? "غير معروف"}</strong></p><p>الرخصة: <strong>{result.metadata.license ?? "غير معروفة"}</strong></p></div><ul className="mt-4 list-disc space-y-1 ps-5 text-sm">{result.reasons.map((reason) => <li key={reason}>{reason}</li>)}{result.warnings.map((warning) => <li className="text-amber-800" key={warning}>{warning}</li>)}</ul></div>}</div>;
}
