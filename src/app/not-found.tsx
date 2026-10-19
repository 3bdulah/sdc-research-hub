"use client";

import Link from "next/link";
import { useLocale } from "@/components/locale-provider";

export default function NotFound() { const { locale } = useLocale(); const en = locale === "en"; return <main className="flex min-h-screen items-center justify-center bg-sand p-6" dir={en ? "ltr" : "rtl"}><section className="rounded-2xl bg-white p-8 text-center shadow-sm"><p className="text-4xl font-bold text-teal">404</p><h1 className="mt-2 text-xl font-bold">{en ? "Page not found" : "الصفحة غير موجودة"}</h1><Link className="mt-5 inline-block rounded-xl bg-teal px-4 py-2 text-white" href="/">{en ? "Return to workspace" : "العودة لمساحة العمل"}</Link></section></main>; }
