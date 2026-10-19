import { describe, expect, it } from "vitest";
import { demoPollResponses } from "@/lib/matching-demo";
import { parsePollCsv, suggestMatching } from "@/lib/matching";

describe("M7 matching studio", () => {
  it("creates 15 pair suggestions and 4 review groups from demo data", () => { const result = suggestMatching(demoPollResponses); expect(result.pairs).toHaveLength(15); expect(result.reviewGroups.map((group) => group.memberIds.length)).toEqual([5, 5, 4, 4]); expect(result.pairs.every((pair) => pair.memberIds.length === 2)).toBe(true); });
  it("keeps scientific-reading experience inside every pair", () => { const members = new Map(demoPollResponses.map((member) => [member.id, member])); expect(suggestMatching(demoPollResponses).pairs.every((pair) => pair.memberIds.some((id) => members.get(id)?.priorTranslation))).toBe(true); });
  it("parses the poll CSV without external services", () => { const csv = "id,name,email,axisRanking,trackPreference,sectors,reading,translation,arabicWriting,technical,threadWriting,priorTranslation,weeklyHours\n1,عضو تجريبي,one@example.test,a1|a2|a3,pair,Health|Education,4,3,4,3,2,true,6"; expect(parsePollCsv(csv)[0].axisRanking).toEqual(["a1", "a2", "a3"]); });
});
