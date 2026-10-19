import { NextResponse } from "next/server";
import { demoPollResponses } from "@/lib/matching-demo";
import { parsePollCsv, suggestMatching } from "@/lib/matching";
import { getAppMode } from "@/lib/mode";
import { getMatchingState, saveMatchingRun, updateMatchingState } from "@/lib/db/runtime";

export function GET() { if (getAppMode() === "private") { const state = getMatchingState(); if (state.members.length) return NextResponse.json({ mode: "private-local", memberCount: state.members.length, ...state }); } return NextResponse.json({ mode: "demo", memberCount: demoPollResponses.length, result: suggestMatching(demoPollResponses), leaderApproved: false, deputyApproved: false }); }
export async function POST(request: Request) { try { if (getAppMode() !== "private") return NextResponse.json({ error: "استيراد CSV متاح في private mode فقط لحماية بيانات الأعضاء." }, { status: 403 }); const body = await request.json() as { csv?: string }; if (!body.csv?.trim()) return NextResponse.json({ error: "يجب إرسال نص CSV." }, { status: 400 }); const members = parsePollCsv(body.csv); return NextResponse.json({ mode: "private-local", memberCount: members.length, ...saveMatchingRun(members, suggestMatching(members)) }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر تحليل CSV" }, { status: 400 }); } }
export async function PATCH(request: Request) { try { if (getAppMode() !== "private") return NextResponse.json({ error: "تعديل التوزيع متاح في private mode فقط." }, { status: 403 }); return NextResponse.json(updateMatchingState(await request.json())); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر حفظ قرار التوزيع" }, { status: 400 }); } }
