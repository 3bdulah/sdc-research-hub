import { z } from "zod";

export const paperInputSchema = z.object({ identifier: z.string().trim().min(1).max(500) });
export type PaperInput = z.infer<typeof paperInputSchema>;
export type SourceKind = "openalex" | "arxiv";
export type LicenseVerdict = "allowed" | "needs_permission" | "reject";

export type PaperMetadata = {
  identifier: string;
  canonicalUrl: string;
  title: string;
  authors: string[];
  venue?: string;
  publishedDate?: string;
  abstract?: string;
  pageCount?: number;
  license?: string;
  source: SourceKind;
};

export type PaperGateResult = {
  metadata: PaperMetadata;
  verdict: LicenseVerdict;
  reasons: string[];
  warnings: string[];
  recency: "within_window" | "too_old" | "unknown";
  size: "within_limit" | "over_limit" | "unknown";
};

export class PaperGateError extends Error {}

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const OPEN_LICENSES = ["cc-by", "cc by", "cc-by-sa", "cc by-sa", "cc0", "public domain", "apache", "mit"];

function normalizeIdentifier(identifier: string): { kind: "doi" | "arxiv"; value: string; canonicalUrl: string } {
  const input = identifier.trim();
  const doiMatch = input.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").match(/^10\.\d{4,9}\/\S+$/i);
  if (doiMatch) return { kind: "doi", value: doiMatch[0], canonicalUrl: `https://doi.org/${doiMatch[0]}` };
  const arxivMatch = input.match(/(?:arxiv\.org\/(?:abs|pdf)\/|arxiv:)?([0-9]{4}\.\d{4,5}(?:v\d+)?|[a-z-]+\/[0-9]{7}(?:v\d+)?)/i);
  if (arxivMatch) return { kind: "arxiv", value: arxivMatch[1], canonicalUrl: `https://arxiv.org/abs/${arxivMatch[1]}` };
  throw new PaperGateError("أدخل رابط arXiv أو DOI صالحًا.");
}

function cleanText(value: string | undefined): string | undefined {
  return value?.replace(/\s+/g, " ").trim() || undefined;
}

function decodeAbstract(invertedIndex: Record<string, number[]> | null | undefined): string | undefined {
  if (!invertedIndex) return undefined;
  return Object.entries(invertedIndex).sort(([, left], [, right]) => left[0] - right[0]).map(([word]) => word).join(" ");
}

function pageCount(firstPage?: string, lastPage?: string): number | undefined {
  const first = Number.parseInt(firstPage ?? "", 10);
  const last = Number.parseInt(lastPage ?? "", 10);
  return Number.isFinite(first) && Number.isFinite(last) && last >= first ? last - first + 1 : undefined;
}

async function readJson(response: Response, source: SourceKind): Promise<Record<string, unknown>> {
  if (!response.ok) throw new PaperGateError(`تعذر الوصول إلى مصدر ${source === "openalex" ? "OpenAlex" : "arXiv"}.`);
  return (await response.json()) as Record<string, unknown>;
}

async function fetchWithTimeout(fetcher: Fetcher, input: RequestInfo | URL, timeoutMs = 6000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetcher(input, { signal: controller.signal, headers: { accept: "application/json" } });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new PaperGateError("انتهت مهلة الاتصال بالمصدر الخارجي.");
    throw new PaperGateError("تعذر الاتصال بالمصدر الخارجي.");
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchOpenAlex(normalized: ReturnType<typeof normalizeIdentifier>, fetcher: Fetcher): Promise<PaperMetadata> {
  const key = normalized.kind === "doi" ? `https://doi.org/${normalized.value}` : normalized.canonicalUrl;
  const response = await fetchWithTimeout(fetcher, `https://api.openalex.org/works/${encodeURIComponent(key)}`);
  const data = await readJson(response, "openalex");
  const biblio = data.biblio as { first_page?: string; last_page?: string } | undefined;
  const location = data.best_oa_location as { license?: string; landing_page_url?: string } | undefined;
  const authors = Array.isArray(data.authorships) ? data.authorships.map((author) => (author as { author?: { display_name?: string } }).author?.display_name).filter((name): name is string => Boolean(name)) : [];
  return {
    identifier: normalized.value,
    canonicalUrl: normalized.canonicalUrl,
    title: cleanText(String(data.title ?? "")) ?? "بدون عنوان",
    authors,
    venue: cleanText((data.primary_location as { source?: { display_name?: string } } | undefined)?.source?.display_name),
    publishedDate: typeof data.publication_date === "string" ? data.publication_date : undefined,
    abstract: decodeAbstract(data.abstract_inverted_index as Record<string, number[]> | null | undefined),
    pageCount: pageCount(biblio?.first_page, biblio?.last_page),
    license: cleanText(location?.license),
    source: "openalex",
  };
}

function xmlValue(xml: string, tag: string): string | undefined {
  return cleanText(xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"))?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, ""));
}

async function fetchArxiv(normalized: ReturnType<typeof normalizeIdentifier>, fetcher: Fetcher): Promise<PaperMetadata> {
  const response = await fetchWithTimeout(fetcher, `https://export.arxiv.org/api/query?id_list=${encodeURIComponent(normalized.value)}`);
  if (!response.ok) throw new PaperGateError("تعذر الوصول إلى مصدر arXiv.");
  const xml = await response.text();
  const entry = xml.match(/<entry>([\s\S]*?)<\/entry>/i)?.[1];
  if (!entry) throw new PaperGateError("لم يُعثر على البحث في arXiv.");
  const authors = [...entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/gi)].map((match) => cleanText(match[1])).filter((name): name is string => Boolean(name));
  return { identifier: normalized.value, canonicalUrl: normalized.canonicalUrl, title: xmlValue(entry, "title") ?? "بدون عنوان", authors, publishedDate: xmlValue(entry, "published")?.slice(0, 10), abstract: xmlValue(entry, "summary"), source: "arxiv" };
}

function monthsAgo(date: string, now: Date): number {
  return Math.floor((now.getTime() - parseDate(date).getTime()) / (30.4375 * 24 * 60 * 60 * 1000));
}

function parseDate(date: string): Date {
  return new Date(`${date.slice(0, 10)}T00:00:00Z`);
}

export function evaluatePaper(metadata: PaperMetadata, now = new Date()): PaperGateResult {
  const reasons: string[] = [];
  const warnings: string[] = [];
  const age = metadata.publishedDate ? monthsAgo(metadata.publishedDate, now) : undefined;
  const recency = age === undefined ? "unknown" : age <= 18 ? "within_window" : "too_old";
  const size = metadata.pageCount === undefined ? "unknown" : metadata.pageCount <= 25 ? "within_limit" : "over_limit";
  if (recency === "too_old") reasons.push("البحث أقدم من 18 شهرًا.");
  if (recency === "unknown") reasons.push("تاريخ النشر غير معروف.");
  if (size === "over_limit") warnings.push("عدد الصفحات أكبر من 25؛ يلزم تنبيه الفريق قبل الاعتماد.");
  const license = metadata.license?.toLowerCase();
  const allowed = license ? OPEN_LICENSES.some((known) => license.includes(known)) : false;
  if (allowed) reasons.push("الرخصة تسمح بالترجمة وإعادة التوزيع.");
  else if (license) reasons.push("الرخصة غير مفتوحة بما يكفي؛ يلزم إذن كتابي من المؤلف.");
  else reasons.push("الرخصة غير معروفة؛ يجب رفض البحث حتى التحقق يدويًا.");
  const verdict: LicenseVerdict = !license ? "reject" : allowed && recency !== "too_old" ? "allowed" : recency === "too_old" ? "reject" : "needs_permission";
  return { metadata, verdict, reasons, warnings, recency, size };
}

export async function inspectPaper(input: PaperInput, options: { fetcher?: Fetcher; now?: Date } = {}): Promise<PaperGateResult> {
  const parsed = paperInputSchema.parse(input);
  const normalized = normalizeIdentifier(parsed.identifier);
  const fetcher = options.fetcher ?? fetch;
  let metadata: PaperMetadata;
  try {
    metadata = await fetchOpenAlex(normalized, fetcher);
  } catch (openAlexError) {
    if (normalized.kind !== "arxiv") throw openAlexError;
    metadata = await fetchArxiv(normalized, fetcher);
  }
  return evaluatePaper(metadata, options.now);
}
