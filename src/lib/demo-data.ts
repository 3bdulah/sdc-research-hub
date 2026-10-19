export type FileStatus = "not_started" | "drafting" | "submitted" | "in_review" | "changes_requested" | "approved";
export type DemoPaper = { id: string; titleAr: string; axis: string; pair: number; sector: string; license: "allowed" | "needs_permission" | "reject"; translation: FileStatus; summary: FileStatus };
const statuses: FileStatus[] = ["approved", "in_review", "drafting", "submitted", "changes_requested", "not_started"];
export const demoCounts = { pairs: 15, coordinators: 3, reviewers: 18, reviewGroups: 4, papers: 15 } as const;
export const demoPapers: DemoPaper[] = Array.from({ length: 15 }, (_, index) => ({
  id: `paper-${String(index + 1).padStart(2, "0")}`,
  titleAr: `بحث تجريبي ${index + 1}: تطبيقات الذكاء الاصطناعي الموثوقة`,
  axis: `a${(index % 3) + 1}`,
  pair: index + 1,
  sector: ["التعليم", "الصحة", "الطاقة", "التمويل", "الخدمات الحكومية"][index % 5],
  license: index === 4 ? "needs_permission" : index === 9 ? "reject" : "allowed",
  translation: statuses[index % statuses.length],
  summary: statuses[(index + 2) % statuses.length],
}));
