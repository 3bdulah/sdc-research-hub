import { describe, expect, it } from "vitest";
import { generateMonthlyReport } from "@/lib/report";

describe("M5 KPI and reporting", () => {
  it("generates a human-reviewable Arabic Markdown report", () => {
    const report = generateMonthlyReport("2026-11", [{ id: "1", titleAr: "بحث", axis: "a1", pair: 1, sector: "التعليم", license: "allowed", translation: "approved", summary: "approved", complete: true, dueDate: "2026-11-18", escalation: "none", overdueHours: 0 }]);
    expect(report).toContain("# التقرير الشهري");
    expect(report).toContain("1/15");
    expect(report).toContain("DRAFT (مسودة)");
  });
});
