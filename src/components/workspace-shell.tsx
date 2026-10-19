"use client";

import Image from "next/image";
import { useState } from "react";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useLocale } from "@/components/locale-provider";
import type { ReactNode } from "react";

type Section = "overview" | "papers" | "team" | "calendar" | "insights" | "publishing";
type Props = {
  panels: Record<Section, ReactNode>;
  counts: { papers: number; complete: number; translations: number; summaries: number };
  cycleStart: string;
};

const nav: Array<{ id: Section; ar: string; en: string; icon: string }> = [
  { id: "overview", ar: "نظرة عامة", en: "Overview", icon: "◫" },
  { id: "papers", ar: "الدورة والأبحاث", en: "Cycle & papers", icon: "▤" },
  { id: "team", ar: "الفريق والتوزيع", en: "Team & matching", icon: "⌘" },
  { id: "calendar", ar: "التقويم والقيادة", en: "Calendar", icon: "▦" },
  { id: "insights", ar: "المؤشرات والتقارير", en: "Insights", icon: "⌁" },
  { id: "publishing", ar: "النشر والتصدير", en: "Publishing", icon: "↗" },
];

export function WorkspaceShell({ panels, counts, cycleStart }: Props) {
  const [active, setActive] = useState<Section>("overview");
  const { locale } = useLocale();
  const en = locale === "en";
  const titles: Record<Section, [string, string]> = {
    overview: ["مركز متابعة البحث العلمي", "Research operations, in one place"],
    papers: ["الدورة والأبحاث", "Cycle & research papers"],
    team: ["الفريق والتوزيع", "Team & matching"],
    calendar: ["التقويم والقيادة", "Calendar & leadership"],
    insights: ["المؤشرات والتقارير", "Insights & reports"],
    publishing: ["النشر والتصدير", "Publishing & exports"],
  };
  return <div className="workspace" dir={en ? "ltr" : "rtl"}>
    <aside className="sidebar">
      <div className="brand-lockup"><Image src="/brand/sdc.png" alt="SDC" width={44} height={44} priority /><div><span className="brand-overline">SAUDI DEVELOPERS COMMUNITY</span><strong>Research Hub</strong></div></div>
      <div className="workspace-label">{en ? "WORKSPACE" : "مساحة العمل"}</div>
      <nav className="side-nav" aria-label={en ? "Main navigation" : "التنقل الرئيسي"}>{nav.map((item) => <button key={item.id} className={`nav-item ${active === item.id ? "is-active" : ""}`} onClick={() => setActive(item.id)} aria-current={active === item.id ? "page" : undefined}><span className="nav-icon" aria-hidden="true">{item.icon}</span><span>{en ? item.en : item.ar}</span>{item.id === "papers" && <span className="nav-count">{counts.papers}</span>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-cycle"><span className="status-dot"/><div><small>{en ? "PLANNED CYCLE" : "الدورة المخططة"}</small><strong>{cycleStart}</strong></div></div>
      <div className="sidebar-foot">{en ? "Private workspace · Riyadh time" : "مساحة خاصة · توقيت الرياض"}</div>
    </aside>

    <main id="main-content" className="main-area">
      <header className="topbar"><div className="breadcrumbs"><span>SDC</span><span className="crumb-sep">/</span><strong>{en ? nav.find((item) => item.id === active)?.en : nav.find((item) => item.id === active)?.ar}</strong></div><div className="top-actions"><span className="workspace-state"><i className="status-dot"/>{en ? "Local workspace" : "مساحة عمل محلية"}</span><LocaleSwitcher /></div></header>
      <div className="content-wrap">
        <section className="page-heading"><div><p className="eyebrow">SDC <span>·</span> {en ? "SCIENTIFIC RESEARCH" : "فريق البحث العلمي"}</p><h1>{en ? titles[active][1] : titles[active][0]}</h1><p className="page-subtitle">{en ? "A clear view of the work, decisions, and research outputs." : "رؤية واضحة للمهام والقرارات والمخرجات البحثية."}</p></div><div className="heading-mark"><Image src="/brand/scientific-research-team.png" alt={en ? "Scientific Research Team" : "فريق البحث العلمي"} width={75} height={50} priority /></div></section>
        {active === "overview" && <>
          <section className="welcome-panel"><div className="welcome-copy"><span className="welcome-kicker"><i className="status-dot"/>{en ? "RESEARCH TEAM · OPERATIONS" : "فريق البحث العلمي · إدارة العمل"}</span><h2>{en ? <>Make every paper<br/><em>count.</em></> : <>كل بحث يضيف<br/><em>معرفة تستحق الثقة.</em></>}</h2><p>{en ? "Coordinate the monthly research cycle, review the source, and deliver two reliable Arabic files for every approved paper." : "نسّق دورة البحث الشهرية، وتحقق من المصادر، وقدّم ملفين عربيين موثوقين لكل بحث معتمد."}</p><button className="primary-action" onClick={() => setActive("papers")}>{en ? "Open cycle board" : "افتح لوحة الدورة"}<span aria-hidden="true">↗</span></button></div><div className="welcome-visual" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><span className="orbit-label">{en ? "15 PAPERS · 4 THREADS · 1 DIGEST" : "١٥ بحثًا · ٤ ثريدات · ملخص واحد"}</span><span className="orbit-core">SDC</span><span className="orbit-caption">RESEARCH<br/>IN MOTION</span></div></section>
          <section className="metric-grid" aria-label={en ? "Cycle progress" : "تقدم الدورة"}>{[[en ? "Papers registered" : "الأبحاث المسجلة", counts.papers, en ? "Target: 15" : "المستهدف: 15", "01"],[en ? "Translations approved" : "الترجمات المعتمدة", counts.translations, en ? "One per paper" : "ترجمة مستقلة لكل بحث", "02"],[en ? "Summaries approved" : "الملخصات المعتمدة", counts.summaries, en ? "One per paper" : "ملخص مستقل لكل بحث", "03"]].map(([label, value, note, number]) => <article className="metric-card" key={String(number)}><div className="metric-top"><span>{number}</span><span className="metric-arrow">↗</span></div><p>{label}</p><strong>{value}</strong><small>{note}</small></article>)}</section>
          <section className="setup-note"><div className="setup-symbol">✓</div><div><strong>{en ? `${counts.complete} of 15 papers meet the two-file completion rule` : `${counts.complete} من 15 بحثًا استوفى شرط اعتماد الملفين`}</strong><p>{en ? "A paper counts as complete only after its full Arabic translation and separate short summary are both approved." : "لا يُحتسب البحث مكتملًا إلا بعد اعتماد الترجمة العربية الكاملة والملخص المختصر كملفين منفصلين."}</p></div><button className="text-action" onClick={() => setActive("papers")}>{en ? "Review cycle" : "متابعة الدورة"}<span>→</span></button></section>
          <div className="overview-grid"><section className="surface-card cycle-preview"><div className="section-heading"><div><p className="eyebrow">01 / {en ? "CURRENT WORK" : "العمل الحالي"}</p><h2>{en ? "Monthly cycle" : "الدورة الشهرية"}</h2></div><button className="text-action" onClick={() => setActive("papers")}>{en ? "View board" : "عرض اللوحة"}<span>→</span></button></div><div className="cycle-empty"><span className="empty-glyph">◎</span><strong>{counts.papers === 0 ? (en ? "No papers have been added yet" : "لم تُضف أبحاث إلى الدورة بعد") : (en ? `${counts.papers} papers are in the cycle` : `الأبحاث المسجلة في الدورة: ${counts.papers}`)}</strong><p>{counts.papers === 0 ? (en ? "Start with the source and reuse-license check." : "ابدأ بفحص المصدر ورخصة إعادة الاستخدام.") : (en ? "Track each full translation and short summary separately." : "تابع الترجمة الكاملة والملخص المختصر كلًا على حدة.")}</p></div></section><section className="surface-card cycle-date"><p className="eyebrow">02 / {en ? "PLANNING" : "التخطيط"}</p><h2>{en ? "Planned cycle" : "الدورة المخططة"}</h2><div className="date-display"><span className="date-day">01</span><span className="date-meta"><strong>{cycleStart.slice(0, 7)}</strong><small>{en ? "Planned start · confirm with committee" : "بداية مخططة · بانتظار تأكيد اللجنة"}</small></span></div><div className="date-rule"><span>{en ? "Release target" : "موعد الإصدار"}</span><strong>{en ? "Day 28" : "اليوم 28"}</strong></div><p className="mt-3 text-xs text-ink/60">{en ? "Monthly target: 15 papers · 4 research threads · 1 digest" : "المستهدف الشهري: ١٥ بحثًا · ٤ ثريدات · ملخص واحد"}</p></section></div>
        </>}
        {active !== "overview" && <section className="panel-page"><div className="panel-intro"><span className="panel-index">{String(nav.findIndex((item) => item.id === active)).padStart(2,"0")}</span><div><h2>{en ? titles[active][1] : titles[active][0]}</h2><p>{en ? "Tools and records for this part of the research workflow." : "الأدوات والسجلات الخاصة بهذا الجزء من سير العمل البحثي."}</p></div></div>{panels[active]}</section>}
        <footer className="page-footer"><span>SDC · SCIENTIFIC RESEARCH TEAM</span><span>{en ? "Built for careful, collaborative research." : "لعمل بحثي متأنٍ وتعاوني."}</span></footer>
      </div>
    </main>
  </div>;
}
