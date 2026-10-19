import { NextResponse } from "next/server";
import { demoPollResponses } from "@/lib/matching-demo";
import { parsePollCsv, suggestMatching } from "@/lib/matching";

export function GET() { return NextResponse.json({ mode: "demo", memberCount: demoPollResponses.length, result: suggestMatching(demoPollResponses) }); }
export async function POST(request: Request) { try { const body = await request.json() as { csv?: string }; if (!body.csv?.trim()) return NextResponse.json({ error: "يجب إرسال نص CSV." }, { status: 400 }); return NextResponse.json({ mode: "private-local", memberCount: parsePollCsv(body.csv).length, result: suggestMatching(parsePollCsv(body.csv)) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تحليل CSV" }, { status: 400 }); } }
