import Link from "next/link";

export default function NotFound() { return <main className="flex min-h-screen items-center justify-center bg-sand p-6" dir="rtl"><section className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-4xl font-bold text-teal">404</p><h1 className="mt-2 text-xl font-bold">الصفحة غير موجودة</h1><Link className="mt-5 inline-block rounded-xl bg-teal px-4 py-2 text-white" href="/">العودة للمركز</Link></section></main>; }
