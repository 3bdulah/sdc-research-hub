"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/locale-provider";

type PublishingStatus = { papersCount: number; completePapers: number; sourceFilesStored: boolean };

export function PublishingStudio() {
  const { locale } = useLocale();
  const en = locale === "en";
  const t = (ar: string, english: string) => en ? english : ar;
  const [status, setStatus] = useState<PublishingStatus | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetch("/api/publishing").then(async (response) => {
      if (!response.ok) throw new Error();
      setStatus(await response.json() as PublishingStatus);
    }).catch(() => setError(en ? "Could not load release readiness." : "تعذر تحميل حالة جاهزية الإصدار."));
  }, [en]);

  return <div className="space-y-5" dir={en ? "ltr" : "rtl"}>
    <section className="rounded-2xl border border-ink/10 bg-white p-6">
      <p className="eyebrow">{t("جاهزية الإصدار", "RELEASE READINESS")}</p>
      <h2 className="mt-2 text-xl font-bold">{t("لا ننشر قبل اكتمال المحتوى والمراجعة", "No release before content and review are complete")}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-ink/65">{t("يتطلب الإصدار ملخصًا شهريًا مبنيًا على الملفات الفعلية، وأربعة ثريدات موثقة المصادر، واعتمادًا بشريًا. التطبيق الحالي يتابع حالات التسليم لكنه لا يخزّن ملفات الترجمة والملخص أو نصوص النشر نفسها.", "A release requires a digest built from actual files, four threads with verified sources, and human approval. This version tracks deliverable statuses but does not store translation/summary files or publication copy.")}</p>
      {error && <p className="mt-4 rounded-lg bg-coral/10 p-3 text-sm text-coral" role="alert">{error}</p>}
      {status && <div className="mt-5 grid gap-3 sm:grid-cols-3">{[[t("أبحاث مسجلة", "Papers registered"), status.papersCount], [t("ملفان معتمدان", "Both files approved"), status.completePapers], [t("محتوى الملفات محفوظ", "Source files stored"), status.sourceFilesStored ? t("نعم", "Yes") : t("لا", "No")]].map(([label, value]) => <article className="rounded-xl bg-sand p-4" key={String(label)}><p className="text-xs text-ink/60">{label}</p><strong className="mt-1 block text-xl text-teal">{value}</strong></article>)}</div>}
    </section>
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6"><h3 className="font-semibold text-amber-950">{t("ما الذي يلزم لإتاحة النشر؟", "What is needed to enable publishing?")}</h3><ol className="mt-3 list-decimal space-y-2 ps-5 text-sm leading-6 text-amber-950">{[t("إرفاق ملف الترجمة العربية الكاملة وملف الملخص كلٌّ على حدة لكل بحث.", "Store the full Arabic translation and short summary as separate files for each paper."), t("تسجيل المراجعتين اللغوية والعلمية وروابط المصادر القابلة للتحقق.", "Record independent language and scientific reviews plus verifiable source links."), t("تطبيق اعتماد القائد والنائبة بعد ربط الدخول والصلاحيات الفعلية.", "Implement authenticated lead/deputy approvals."), t("عدم تفعيل التصدير أو الإرسال حتى تعتمد اللجنة قناة النشر.", "Keep exports and external sending off until the committee approves a publishing channel.")].map((item) => <li key={item}>{item}</li>)}</ol>
    </section>
    <p className="text-xs leading-6 text-ink/55">{t("المستهدف المعتمد في الخطة: 15 بحثًا، 4 ثريدات، ملخص علمي واحد شهريًا. هذه الشاشة لا تنشئ أمثلة أو مخرجات افتراضية.", "Plan targets: 15 papers, 4 threads, and one monthly digest. This screen does not generate sample records or placeholder outputs.")}</p>
  </div>;
}
