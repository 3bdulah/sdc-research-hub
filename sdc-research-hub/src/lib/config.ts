import axes from "../../seed/axes.json";
import kpis from "../../seed/kpis.json";
import plan from "../../seed/plan.json";
import topics from "../../seed/topics.json";
import responsibilities from "../../seed/responsibilities.json";
import pendingApprovals from "../../seed/pending-approvals.json";

export const seedConfig = { axes, kpis, plan, topics, responsibilities, pendingApprovals } as const;
export const defaultCycleStart = seedConfig.plan.cycleStart;
export type Role = "leader" | "deputy" | "coordinator" | "pair" | "reviewer";
export const roles: Role[] = ["leader", "deputy", "coordinator", "pair", "reviewer"];
