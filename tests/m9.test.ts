import { describe, expect, it } from "vitest";
import { balanceReviewers, buildThread, compileDigest, digestToMarkdown, generateMessage } from "@/lib/publishing";
import { demoPapers } from "@/lib/demo-data";
import { buildPaperBoard } from "@/lib/cycle";
import { renderDocx, renderPdf } from "@/lib/publishing-export";

describe("M9 publishing studio", () => {
  const board = buildPaperBoard(demoPapers, "2026-11-01", new Date("2026-11-01T00:00:00Z"));
  it("builds a thread with six tweets, visual brief, and sources", () => { const thread = buildThread(board[0], "نتيجة مسودة"); expect(thread.tweets).toHaveLength(6); expect(thread.visualBrief).toContain("بطاقة"); expect(thread.sourcesTweet).toContain(board[0].id); });
  it("compiles all 15 papers by axis and includes a glossary appendix", () => { const digest = compileDigest(board, Object.fromEntries(board.map((paper) => [paper.id, "ملخص"])), ["مصطلح"], ["فريق"]); expect(digest.sections.reduce((total, section) => total + section.summaries.length, 0)).toBe(15); expect(digestToMarkdown(digest)).toContain("ملحق القاموس"); });
  it("balances two reviewers per paper", () => { const assignments = balanceReviewers(["p1", "p2", "p3"], ["r1", "r2", "r3", "r4"]); expect(assignments.every((assignment) => assignment.reviewerIds.length > 0)).toBe(true); expect(assignments.every((assignment) => assignment.reviewerIds.length === 2)).toBe(true); });
  it("labels generated messages as drafts", () => { expect(generateMessage("reminder", "عضو", "2026-11-18")).toContain("DRAFT (مسودة)"); });
  it("renders real DOCX and PDF byte streams", async () => { const docx = await renderDocx("# نشرة تجريبية"); const pdf = await renderPdf("نشرة تجريبية"); expect(docx.byteLength).toBeGreaterThan(1000); expect(pdf.byteLength).toBeGreaterThan(1000); });
});
