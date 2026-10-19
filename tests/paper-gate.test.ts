import { describe, expect, it } from "vitest";
import { evaluatePaper, inspectPaper, type PaperMetadata } from "@/lib/paper-gate";

const now = new Date("2026-10-19T00:00:00Z");

function metadata(overrides: Partial<PaperMetadata> = {}): PaperMetadata {
  return { identifier: "10.1234/demo", canonicalUrl: "https://doi.org/10.1234/demo", title: "بحث تجريبي", authors: ["Demo Author"], publishedDate: "2026-01-10", source: "openalex", ...overrides };
}

describe("M2 paper gate", () => {
  it("allows a recent CC BY paper and warns above 25 pages", () => {
    const result = evaluatePaper(metadata({ license: "cc-by", pageCount: 28 }), now);
    expect(result.verdict).toBe("allowed");
    expect(result.recency).toBe("within_window");
    expect(result.size).toBe("over_limit");
    expect(result.warnings).toHaveLength(1);
  });

  it("requires written permission for a known closed license", () => {
    expect(evaluatePaper(metadata({ license: "publisher license" }), now).verdict).toBe("needs_permission");
  });

  it("rejects an unknown license and an old paper", () => {
    expect(evaluatePaper(metadata({ license: undefined }), now).verdict).toBe("reject");
    expect(evaluatePaper(metadata({ license: "cc-by", publishedDate: "2023-01-01" }), now).verdict).toBe("reject");
  });

  it("uses OpenAlex first and falls back to arXiv", async () => {
    const xml = `<entry><id>https://arxiv.org/abs/2401.12345</id><title>Fallback Paper</title><published>2025-12-01T00:00:00Z</published><author><name>Fallback Author</name></author><summary>Short abstract.</summary></entry>`;
    let calls = 0;
    const result = await inspectPaper({ identifier: "arxiv:2401.12345" }, {
      now,
      fetcher: async () => {
        calls += 1;
        return calls === 1 ? new Response("not found", { status: 404 }) : new Response(xml, { status: 200 });
      },
    });
    expect(calls).toBe(2);
    expect(result.metadata.source).toBe("arxiv");
    expect(result.verdict).toBe("reject");
    expect(result.metadata.authors).toEqual(["Fallback Author"]);
  });

  it("rejects malformed identifiers before making a network request", async () => {
    await expect(inspectPaper({ identifier: "not a paper" }, { fetcher: async () => { throw new Error("network should not run"); } })).rejects.toThrow("أدخل رابط arXiv أو DOI صالحًا");
  });
});
