import { NextResponse } from "next/server";
import { z } from "zod";
import { saveProposal } from "@/lib/db/runtime";

const proposalSchema = z.object({ pairId: z.string().min(1), url: z.string().url(), title: z.string().optional(), authors: z.string().optional(), publishedDate: z.string().optional(), licenseUrl: z.string().url().optional(), permissionNote: z.string().optional(), permissionNoteDate: z.string().optional(), sector: z.string().min(1), licenseVerdict: z.enum(["allowed", "needs_permission", "reject"]), selected: z.boolean().default(false) }).superRefine((value, context) => {
  if (value.licenseVerdict === "needs_permission" && (!value.permissionNote || !value.permissionNoteDate)) context.addIssue({ code: z.ZodIssueCode.custom, message: "يجب تسجيل ملاحظة الإذن وتاريخها قبل حفظ بحث يحتاج إذنًا." });
});

export async function POST(request: Request) {
  const parsed = proposalSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "بيانات الاقتراح غير صالحة." }, { status: 400 });
  return NextResponse.json({ proposal: saveProposal(parsed.data) }, { status: 201 });
}
