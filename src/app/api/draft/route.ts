import { NextResponse } from "next/server";
import { generateArabicDraft, parseGlossaryCsv, type DraftInput, type DraftResult, type GlossaryEntry } from "@/lib/draft";
import { getDraftRecord, saveDraftRecord, updateDraftReview } from "@/lib/db/runtime";

export function GET() { return NextResponse.json(getDraftRecord()); }
export async function POST(request: Request) { try { const body = await request.json() as { input: DraftInput; glossary?: GlossaryEntry[]; glossaryCsv?: string }; const glossary = body.glossaryCsv ? parseGlossaryCsv(body.glossaryCsv) : body.glossary ?? []; const draft = generateArabicDraft(body.input, glossary); return NextResponse.json(saveDraftRecord(body.input, draft, glossary)); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر توليد المسودة" }, { status: 400 }); } }
export async function PATCH(request: Request) { try { const body = await request.json() as { checklist: DraftResult["checklist"]; approved: boolean }; const result = updateDraftReview(body.checklist, body.approved); if (!result) return NextResponse.json({ error: "لا توجد مسودة محفوظة." }, { status: 404 }); return NextResponse.json(result); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر حفظ المراجعة" }, { status: 400 }); } }
