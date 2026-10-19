"use client";
import { useLocale } from "@/components/locale-provider";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { locale } = useLocale(); const en = locale === "en";
  return <main className="flex min-h-screen items-center justify-center bg-sand p-6" dir={en ? "ltr" : "rtl"}><section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-sm text-coral">{en ? "Workspace error" : "خطأ في مساحة العمل"}</p><h1 className="mt-2 text-2xl font-bold">{en ? "The workspace could not load" : "تعذر تحميل مساحة العمل"}</h1><p className="mt-3 text-sm leading-7 text-ink/65">{en ? "A local error occurred. Your saved records have not been intentionally changed. Try again." : "حدث خطأ محلي. لم تُغيّر السجلات المحفوظة عمدًا. حاول مرة أخرى."}</p><button type="button" className="mt-5 rounded-xl bg-teal px-4 py-2 text-white" onClick={() => reset()}>{en ? "Try again" : "إعادة المحاولة"}</button></section></main>;
}
