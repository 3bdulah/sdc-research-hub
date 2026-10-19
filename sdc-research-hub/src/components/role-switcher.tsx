"use client";
import { useState } from "react";
import type { Role } from "@/lib/config";
const labels: Record<Role, string> = { leader: "القائد", deputy: "النائبة", coordinator: "منسق محور", pair: "ثنائي بحثي", reviewer: "مراجع" };
export function RoleSwitcher() { const [role, setRole] = useState<Role>("leader"); return <label className="flex items-center gap-2 text-sm"><span className="text-ink/60">الدور التجريبي</span><select aria-label="اختيار الدور التجريبي" className="rounded-lg border border-ink/15 bg-white px-2 py-1.5" value={role} onChange={(event) => setRole(event.target.value as Role)}>{Object.entries(labels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>; }
