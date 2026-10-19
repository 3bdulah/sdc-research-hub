import { NextResponse } from "next/server";
import { getPublishingState, listStoredPapers } from "@/lib/db/runtime";

function buildPayload() { const state = getPublishingState(); const papers = listStoredPapers(); return { thread: null, digest: null, digestMarkdown: "", reminder: "", announcement: "", assignments: state.assignments, approvals: state.approvals, papersCount: papers.length, completePapers: papers.filter((paper) => paper.complete).length, sourceFilesStored: false }; }
export function GET() { return NextResponse.json(buildPayload()); }
