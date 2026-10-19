import sectors from "../../seed/sectors.json";
import activities from "../../seed/activities.json";
import intersections from "../../seed/intersections.json";
import topics from "../../seed/topics.json";

export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";
export type MonthPlan = { month: string; labelAr: string; quarter: Quarter; topics: string[]; sectors: Record<string, string[]>; activities: (typeof activities)[Quarter]; intersections: string[] };

const months = ["2026-11", "2026-12", "2027-01", "2027-02", "2027-03", "2027-04", "2027-05", "2027-06", "2027-07", "2027-08", "2027-09", "2027-10"];
const monthLabels: Record<string, string> = { "2026-11": "نوفمبر 2026", "2026-12": "ديسمبر 2026", "2027-01": "يناير 2027", "2027-02": "فبراير 2027", "2027-03": "مارس 2027", "2027-04": "أبريل 2027", "2027-05": "مايو 2027", "2027-06": "يونيو 2027", "2027-07": "يوليو 2027", "2027-08": "أغسطس 2027", "2027-09": "سبتمبر 2027", "2027-10": "أكتوبر 2027" };

function quarterFor(index: number): Quarter { return `Q${Math.floor(index / 3) + 1}` as Quarter; }

export function buildYearCalendar(): MonthPlan[] {
  return months.map((month, index) => {
    const quarter = quarterFor(index);
    return { month, labelAr: monthLabels[month], quarter, topics: topics[month as keyof typeof topics], sectors: sectors[quarter], activities: activities[quarter], intersections: intersections.filter((item) => item.month === month).flatMap((item) => item.links) };
  });
}

export type Camp = { name: string; startDate?: string; endDate?: string };
export type CampConflict = { status: "unscheduled" | "clear" | "conflict"; reasonAr: string; overlapDays: number[] };

function dayNumber(startDate: string, date: string): number {
  return Math.floor((new Date(`${date}T00:00:00Z`).getTime() - new Date(`${startDate}T00:00:00Z`).getTime()) / 86400000) + 1;
}

export function detectCampConflict(camp: Camp, cycleStart: string): CampConflict {
  if (!camp.startDate || !camp.endDate) return { status: "unscheduled", reasonAr: "المعسكر غير مجدول بعد.", overlapDays: [] };
  const first = dayNumber(cycleStart, camp.startDate);
  const last = dayNumber(cycleStart, camp.endDate);
  const overlapDays = Array.from({ length: Math.max(0, last - first + 1) }, (_, index) => first + index).filter((day) => day >= 3 && day <= 22);
  if (overlapDays.length === 0) return { status: "clear", reasonAr: "لا يوجد تعارض مع أيام العمل الحساسة.", overlapDays: [] };
  const sensitive = overlapDays.filter((day) => day === 18 || day === 28);
  return { status: "conflict", reasonAr: sensitive.length > 0 ? `تعارض مع يوم حساس: ${sensitive.join("، ")}.` : "يتعارض مع فترة الترجمة أو المراجعة.", overlapDays };
}

export function sectorCoverage(axisId: string, papers: Array<{ axis: string; sector: string }>, expectedSectors: string[]): { sector: string; count: number; duplicate: boolean }[] {
  return expectedSectors.map((sector) => { const count = papers.filter((paper) => paper.axis === axisId && paper.sector === sector).length; return { sector, count, duplicate: count > 1 }; });
}
