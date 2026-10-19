import { describe, expect, it } from "vitest";
import { canApprove, generateArabicDraft, glossaryToCsv, parseGlossaryCsv } from "@/lib/draft";

describe("M8 draft assistant", () => {
  const input = { titleAr: "بحث تجريبي", sourceUrl: "https://example.test/paper", authors: ["مؤلف تجريبي"], problem: "المشكلة", methodology: "المنهجية", keyResults: "النتائج", limitations: "القيود", whyItMatters: "الأهمية", sector: "التعليم", summarizers: ["ثنائي"], reviewers: ["مراجع"] };
  it("generates the exact Arabic draft sections and draft label", () => { const result = generateArabicDraft(input, [{ termEn: "Retrieval-Augmented Generation", termAr: "التوليد المعزز بالاسترجاع" }]); expect(result.body).toContain("## المنهجية"); expect(result.body).toContain("DRAFT (مسودة)"); expect(result.approved).toBe(false); });
  it("requires every review gate before approval", () => { expect(canApprove({ sourceOpened: true, licenseVerified: true, translationReviewed: true, summaryReviewed: true, scientificReview: true, languageReview: false })).toBe(false); expect(canApprove({ sourceOpened: true, licenseVerified: true, translationReviewed: true, summaryReviewed: true, scientificReview: true, languageReview: true })).toBe(true); });
  it("round-trips glossary CSV", () => { const entries = parseGlossaryCsv("termEn,termAr,notes\nAI,الذكاء الاصطناعي,مصطلح"); expect(parseGlossaryCsv(glossaryToCsv(entries))).toEqual(entries); });
});
