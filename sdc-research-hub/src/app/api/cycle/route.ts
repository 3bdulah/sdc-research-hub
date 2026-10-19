import { NextResponse } from "next/server";
import { z } from "zod";
import { listStoredPapers, updateDeliverableStatus } from "@/lib/db/runtime";

const updateSchema = z.object({ paperId: z.string().min(1), kind: z.enum(["translation", "summary"]), status: z.enum(["not_started", "drafting", "submitted", "in_review", "changes_requested", "approved"]) });

export function GET() {
  return NextResponse.json({ papers: listStoredPapers() });
}

export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات الحالة غير صالحة." }, { status: 400 });
  return NextResponse.json({ papers: updateDeliverableStatus(parsed.data.paperId, parsed.data.kind, parsed.data.status) });
}
