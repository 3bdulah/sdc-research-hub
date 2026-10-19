"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-sand p-6" dir="rtl"><section className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-sm text-coral">حالة خطأ</p><h1 className="mt-2 text-2xl font-bold">تعذر تحميل مركز الأبحاث</h1><p className="mt-3 text-sm leading-7 text-ink/65">حدث خطأ محلي. بيانات الوضع التجريبي آمنة، ويمكنك المحاولة مرة أخرى.</p><button type="button" className="mt-5 rounded-xl bg-teal px-4 py-2 text-white" onClick={() => reset()}>إعادة المحاولة</button></section></main>;
}
