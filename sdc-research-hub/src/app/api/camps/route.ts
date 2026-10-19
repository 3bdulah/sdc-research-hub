import { NextResponse } from "next/server";
import { listCamps, updateCamp } from "@/lib/db/runtime";

export function GET() { return NextResponse.json({ camps: listCamps() }); }
export async function PATCH(request: Request) { const body = await request.json() as { id: string; startDate?: string; endDate?: string }; return NextResponse.json({ camps: updateCamp(body.id, body.startDate, body.endDate) }); }
