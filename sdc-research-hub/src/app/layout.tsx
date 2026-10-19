import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/components/locale-provider";
export const metadata: Metadata = { title: "مركز أبحاث SDC", description: "لوحة عمل البحث العلمي في مجتمع المطورين السعوديين", applicationName: "SDC Research Hub" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ar" dir="rtl"><body><LocaleProvider>{children}</LocaleProvider></body></html>; }
