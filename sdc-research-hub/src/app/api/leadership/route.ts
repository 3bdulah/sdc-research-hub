import { NextResponse } from "next/server";
import { getLeadershipState, updateLeadershipState } from "@/lib/db/runtime";

export function GET() { return NextResponse.json(getLeadershipState()); }
export async function PATCH(request: Request) { return NextResponse.json(updateLeadershipState(await request.json())); }
