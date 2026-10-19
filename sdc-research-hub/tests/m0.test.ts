import { describe, expect, it } from "vitest";
import { defaultCycleStart, seedConfig } from "@/lib/config";
import { demoCounts, demoPapers } from "@/lib/demo-data";
import { getAppMode, privateDataPath } from "@/lib/mode";
import { escalationFor, generateCycleCalendar, isComplete, shiftToEarlierWorkday } from "@/lib/cycle";
import { parseMembersCsv } from "@/lib/db/private-import";

describe("M0 demo foundation", () => {
  it("contains the expected synthetic team shape", () => {
    expect(demoCounts).toEqual({ pairs: 15, coordinators: 3, reviewers: 18, reviewGroups: 4, papers: 15 });
    expect(demoPapers).toHaveLength(15);
    expect(demoPapers.every((paper) => paper.translation && paper.summary)).toBe(true);
  });
  it("loads editable configuration from seed JSON", () => {
    expect(seedConfig.axes).toHaveLength(3);
    expect(seedConfig.kpis).toHaveLength(12);
    expect(defaultCycleStart).toBe("2026-11-01");
  });
  it("defaults safely to demo and constrains private data to private/", () => {
    expect(getAppMode(undefined)).toBe("demo");
    expect(getAppMode("private")).toBe("private");
    expect(privateDataPath("/tmp/real-data")).toBe("./private");
    expect(privateDataPath("private/team.csv")).toBe("private/team.csv");
  });

  it("generates the cycle milestones and shifts Friday/Saturday deadlines earlier", () => {
    expect(shiftToEarlierWorkday("2026-11-28")).toEqual({ date: "2026-11-26", shifted: true });
    expect(shiftToEarlierWorkday("2026-12-18")).toEqual({ date: "2026-12-17", shifted: true });
    expect(shiftToEarlierWorkday("2027-05-28")).toEqual({ date: "2027-05-27", shifted: true });
    expect(shiftToEarlierWorkday("2027-08-28")).toEqual({ date: "2027-08-26", shifted: true });
    expect(shiftToEarlierWorkday("2027-06-18")).toEqual({ date: "2027-06-17", shifted: true });
    expect(shiftToEarlierWorkday("2027-09-18")).toEqual({ date: "2027-09-16", shifted: true });
    const calendar = generateCycleCalendar("2026-11-01");
    expect(calendar).toHaveLength(6);
    expect(calendar.find((milestone) => milestone.id === "release")?.dueDate).toBe("2026-11-26");
  });

  it("requires both independent deliverables to be approved", () => {
    expect(isComplete("approved", "approved")).toBe(true);
    expect(isComplete("approved", "in_review")).toBe(false);
    expect(isComplete("in_review", "approved")).toBe(false);
  });

  it("escalates overdue work at 48 hours and four days", () => {
    expect(escalationFor(48)).toBe("none");
    expect(escalationFor(49)).toBe("coordinator");
    expect(escalationFor(96)).toBe("leader_deputy");
    expect(escalationFor(2, true)).toBe("leader_deputy");
  });

  it("parses private member CSV without providing a demo fallback", () => {
    expect(parseMembersCsv("id,name,email,role\nprivate-1,عضو خاص,private@example.test,pair")).toEqual([{ id: "private-1", name: "عضو خاص", email: "private@example.test", role: "pair" }]);
    expect(() => parseMembersCsv("id,name\nprivate-1,عضو خاص")).toThrow("id,name,email,role");
  });
});
