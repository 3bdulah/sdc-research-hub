import { describe, expect, it } from "vitest";
import { buildYearCalendar, detectCampConflict, sectorCoverage } from "@/lib/calendar";
import { approvalState, finalApprovalReady } from "@/lib/leadership";

describe("M3 leadership cockpit", () => {
  it("calculates the 24-hour approval SLA and dual sign-off state", () => {
    const item = { id: "1", paperTitle: "Demo", proposedAt: "2026-11-01T08:00:00Z", leaderApproved: true, deputyApproved: false, linksOpened: false, totalLinks: 2, openedLinks: 0 };
    expect(approvalState(item, new Date("2026-11-01T20:00:00Z")).remainingSlaHours).toBe(12);
    expect(approvalState(item, new Date("2026-11-02T09:00:00Z")).overdue).toBe(true);
    expect(finalApprovalReady(true, true, true, true, true)).toBe(true);
    expect(finalApprovalReady(true, false, true, true, true)).toBe(false);
  });
});

describe("M4 calendar and sector validator", () => {
  it("builds the complete November-to-October calendar with intersections", () => {
    const calendar = buildYearCalendar();
    expect(calendar).toHaveLength(12);
    expect(calendar[0].month).toBe("2026-11");
    expect(calendar[0].intersections).toContain("a1 ↔ برنامج Vibe");
    expect(calendar[9].quarter).toBe("Q4");
  });

  it("detects unscheduled, clear, and sensitive camp conflicts", () => {
    expect(detectCampConflict({ name: "Camp" }, "2026-11-01").status).toBe("unscheduled");
    expect(detectCampConflict({ name: "Camp", startDate: "2026-12-01", endDate: "2026-12-03" }, "2026-11-01").status).toBe("clear");
    const conflict = detectCampConflict({ name: "Camp", startDate: "2026-11-18", endDate: "2026-11-20" }, "2026-11-01");
    expect(conflict.status).toBe("conflict");
    expect(conflict.overlapDays).toContain(18);
  });

  it("flags sector duplicates inside an axis", () => {
    const result = sectorCoverage("a1", [{ axis: "a1", sector: "التعليم" }, { axis: "a1", sector: "التعليم" }, { axis: "a1", sector: "الصحة" }], ["التعليم", "الصحة", "الطاقة"]);
    expect(result.find((cell) => cell.sector === "التعليم")).toMatchObject({ count: 2, duplicate: true });
    expect(result.find((cell) => cell.sector === "الطاقة")).toMatchObject({ count: 0, duplicate: false });
  });
});
