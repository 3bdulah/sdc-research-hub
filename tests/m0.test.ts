import { describe, expect, it } from "vitest";
import { defaultCycleStart, seedConfig } from "@/lib/config";
import { demoCounts, demoPapers } from "@/lib/demo-data";
import { getAppMode, privateDataPath } from "@/lib/mode";

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
});
