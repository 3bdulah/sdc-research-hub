import type { DemoPaper, FileStatus } from "@/lib/demo-data";

export type CycleStage = "proposals" | "production" | "review" | "changes" | "approval";
export type Escalation = "none" | "coordinator" | "leader_deputy";

export type CycleMilestone = {
  id: string;
  labelAr: string;
  stage: CycleStage;
  cycleDay: number;
  rawDate: string;
  dueDate: string;
  shifted: boolean;
  noticeAr?: string;
};

export type PaperBoardRow = DemoPaper & {
  complete: boolean;
  dueDate: string;
  escalation: Escalation;
  overdueHours: number;
};

const milestones: Array<Pick<CycleMilestone, "id" | "labelAr" | "stage" | "cycleDay">> = [
  { id: "proposals", labelAr: "الاقتراحات والاعتماد", stage: "proposals", cycleDay: 2 },
  { id: "checkpoint", labelAr: "نقطة المتابعة", stage: "production", cycleDay: 14 },
  { id: "files-due", labelAr: "تسليم الترجمة والملخص", stage: "production", cycleDay: 18 },
  { id: "reviews-due", labelAr: "اكتمال المراجعتين", stage: "review", cycleDay: 22 },
  { id: "changes-due", labelAr: "انتهاء التعديلات", stage: "changes", cycleDay: 25 },
  { id: "release", labelAr: "الاعتماد النهائي والإصدار", stage: "approval", cycleDay: 28 },
];

function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: string, days: number): string {
  const result = parseDate(date);
  result.setUTCDate(result.getUTCDate() + days);
  return formatDate(result);
}

export function shiftToEarlierWorkday(date: string): { date: string; shifted: boolean } {
  const result = parseDate(date);
  const day = result.getUTCDay();
  if (day === 5) result.setUTCDate(result.getUTCDate() - 1);
  if (day === 6) result.setUTCDate(result.getUTCDate() - 2);
  return { date: formatDate(result), shifted: day === 5 || day === 6 };
}

export function generateCycleCalendar(startDate: string): CycleMilestone[] {
  return milestones.map((milestone) => {
    const rawDate = addDays(startDate, milestone.cycleDay - 1);
    const shifted = shiftToEarlierWorkday(rawDate);
    return {
      ...milestone,
      rawDate,
      dueDate: shifted.date,
      shifted: shifted.shifted,
      noticeAr: shifted.shifted ? `نُقل من ${rawDate} إلى أقرب يوم عمل سابق` : undefined,
    };
  });
}

export function isComplete(translation: FileStatus, summary: FileStatus): boolean {
  return translation === "approved" && summary === "approved";
}

export function overdueHours(dueDate: string, now = new Date()): number {
  const due = parseDate(dueDate).getTime();
  return Math.max(0, Math.floor((now.getTime() - due) / (60 * 60 * 1000)));
}

export function escalationFor(overdue: number, repeated = false): Escalation {
  if (overdue >= 96 || repeated) return "leader_deputy";
  if (overdue > 48) return "coordinator";
  return "none";
}

export function buildPaperBoard(papers: DemoPaper[], startDate: string, now = new Date()): PaperBoardRow[] {
  const filesDue = generateCycleCalendar(startDate).find((milestone) => milestone.id === "files-due");
  if (!filesDue) throw new Error("Cycle calendar is missing the files-due milestone");
  return papers.map((paper) => {
    const hours = overdueHours(filesDue.dueDate, now);
    return {
      ...paper,
      complete: isComplete(paper.translation, paper.summary),
      dueDate: filesDue.dueDate,
      overdueHours: hours,
      escalation: escalationFor(hours, paper.translation === "changes_requested"),
    };
  });
}
