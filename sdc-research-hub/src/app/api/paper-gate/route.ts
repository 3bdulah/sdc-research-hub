import { NextResponse } from "next/server";
import { inspectPaper, PaperGateError } from "@/lib/paper-gate";

export async function POST(request: Request) {
  try {
    const result = await inspectPaper(await request.json());
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof PaperGateError ? error.message : "تعذر فحص البحث. تحقق من الرابط وحاول مرة أخرى.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
