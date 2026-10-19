import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace-shell";
import { CycleBoard } from "@/components/cycle-board";
import { PaperGateForm } from "@/components/paper-gate-form";
import { LeadershipCalendarPanel } from "@/components/leadership-calendar-panel";
import { KpiPlanPanel } from "@/components/kpi-plan-panel";
import { MatchingStudio } from "@/components/matching-studio";
import { PublishingStudio } from "@/components/publishing-studio";
import { LocalizedCard } from "@/components/localized-card";
import { seedConfig } from "@/lib/config";
import { buildPaperBoard, generateCycleCalendar } from "@/lib/cycle";
import { listStoredPapers } from "@/lib/db/runtime";

export const dynamic = "force-dynamic";

export default function Home() {
  const cycleStart = seedConfig.plan.cycleStart;
  const calendar = generateCycleCalendar(cycleStart);
  const papers = buildPaperBoard(listStoredPapers(), cycleStart, new Date());
  const complete = papers.filter((paper) => paper.complete).length;
  const translations = papers.filter((paper) => paper.translation === "approved").length;
  const summaries = papers.filter((paper) => paper.summary === "approved").length;
  const panels: Record<"papers" | "team" | "calendar" | "insights" | "publishing", ReactNode> = {
    papers: <div className="workflow-stack"><LocalizedCard key="paper-gate" index="01" titleAr="فحص البحث والترخيص" titleEn="Check paper & license"><PaperGateForm /></LocalizedCard><LocalizedCard key="cycle-board" index="02" titleAr="متابعة الترجمة والملخص" titleEn="Track translation & summary"><CycleBoard initialBoard={papers} /></LocalizedCard></div>,
    team: <MatchingStudio />,
    calendar: <LeadershipCalendarPanel papers={papers} milestones={calendar} />,
    insights: <KpiPlanPanel papers={papers} />,
    publishing: <PublishingStudio />,
  };
  return <WorkspaceShell counts={{ papers: papers.length, complete, translations, summaries }} cycleStart={cycleStart} panels={{ ...panels, overview: null }} />;
}
