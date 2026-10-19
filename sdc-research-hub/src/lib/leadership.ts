import type { CycleMilestone } from "@/lib/cycle";

export type ApprovalItem = { id: string; paperTitle: string; proposedAt: string; leaderApproved: boolean; deputyApproved: boolean; linksOpened: boolean; totalLinks: number; openedLinks: number };
export type ApprovalState = { ready: boolean; remainingSlaHours: number; overdue: boolean; linksComplete: boolean; dualSignoff: boolean };

export function approvalState(item: ApprovalItem, now = new Date(), slaHours = 24): ApprovalState {
  const elapsed = Math.floor((now.getTime() - new Date(item.proposedAt).getTime()) / 3600000);
  const remainingSlaHours = Math.max(0, slaHours - elapsed);
  const linksComplete = item.linksOpened && item.openedLinks >= item.totalLinks;
  const dualSignoff = item.leaderApproved && item.deputyApproved;
  return { remainingSlaHours, overdue: elapsed > slaHours, linksComplete, dualSignoff, ready: linksComplete && dualSignoff };
}

export function myDayResponsibilities(cycleDay: number, milestones: CycleMilestone[]): string[] {
  const milestone = milestones.find((item) => item.cycleDay === cycleDay);
  if (!milestone) return ["مراجعة لوحة المخاطر", "متابعة الحالات المتأخرة", "تسجيل أي قرارات في سجل التغيير"];
  return [`متابعة مرحلة: ${milestone.labelAr}`, "مراجعة الحالات المتأخرة", "تحديث رسالة المتابعة للفريق"];
}

export function finalApprovalReady(leaderApproved: boolean, deputyApproved: boolean, linksOpened: boolean, translationApproved: boolean, summaryApproved: boolean): boolean {
  return leaderApproved && deputyApproved && linksOpened && translationApproved && summaryApproved;
}
