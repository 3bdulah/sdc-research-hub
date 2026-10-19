import { NextResponse } from "next/server";
import { z } from "zod";
import { getPlanSnapshot, rollbackPlanEntry, updatePlanEntry } from "@/lib/db/runtime";

const updateSchema = z.object({ kind: z.enum(["plan", "kpis", "axes", "sectors", "topics", "activities", "intersections", "responsibilities"]), value: z.unknown(), action: z.enum(["save", "rollback"]).default("save") });

export function GET() { return NextResponse.json({ config: getPlanSnapshot() }); }
export async function PATCH(request: Request) {
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "إعداد الخطة غير صالح." }, { status: 400 });
  const config = parsed.data.action === "rollback" ? rollbackPlanEntry(parsed.data.kind) : updatePlanEntry(parsed.data.kind, parsed.data.value);
  return NextResponse.json({ config });
}
