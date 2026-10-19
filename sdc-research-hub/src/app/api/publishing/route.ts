import { NextResponse } from "next/server";
import { demoPapers } from "@/lib/demo-data";
import { buildPaperBoard } from "@/lib/cycle";
import { balanceReviewers, buildThread, compileDigest, digestToMarkdown, generateMessage } from "@/lib/publishing";

const board = buildPaperBoard(demoPapers, "2026-11-01", new Date("2026-11-01T00:00:00Z"));
const summaries = Object.fromEntries(board.map((paper) => [paper.id, `ملخص مسودة للبحث في قطاع ${paper.sector}.` ]));
export function GET() { const digest = compileDigest(board, summaries, ["التوليد المعزز بالاسترجاع (RAG)"], ["فريق البحث التجريبي"]); return NextResponse.json({ thread: buildThread(board[0], summaries[board[0].id]), digest, digestMarkdown: digestToMarkdown(digest), reminder: generateMessage("reminder", "عضو تجريبي", "2026-11-18"), announcement: generateMessage("announcement", "", "نوفمبر 2026"), assignments: balanceReviewers(board.map((paper) => paper.id), Array.from({ length: 18 }, (_, index) => `reviewer-${String(index + 1).padStart(2, "0")}`)) }); }
