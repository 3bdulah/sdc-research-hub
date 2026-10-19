import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedConfig } from "@/lib/config";
import { demoPapers, type DemoPaper, type FileStatus } from "@/lib/demo-data";
import { getAppMode, privateDataPath } from "@/lib/mode";
import { importPrivateMembers } from "@/lib/db/private-import";
import { generateCycleCalendar } from "@/lib/cycle";
import type { MatchingResult, PollResponse } from "@/lib/matching";
import type { DraftInput, DraftResult, DraftChecklist, GlossaryEntry } from "@/lib/draft";

let database: DatabaseSync | undefined;

const schemaSql = `
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS axes (id TEXT PRIMARY KEY, name_ar TEXT NOT NULL, name_en TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pairs (id TEXT PRIMARY KEY, axis_id TEXT NOT NULL, coordinator_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS review_groups (id TEXT PRIMARY KEY, name TEXT NOT NULL, head_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cycles (id TEXT PRIMARY KEY, start_date TEXT NOT NULL, end_date TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cycle_tasks (id TEXT PRIMARY KEY, cycle_id TEXT NOT NULL, name TEXT NOT NULL, due_date TEXT NOT NULL, status TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS papers (id TEXT PRIMARY KEY, cycle_id TEXT NOT NULL, pair_id TEXT NOT NULL, title TEXT NOT NULL, sector TEXT NOT NULL, license_verdict TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS deliverables (id TEXT PRIMARY KEY, paper_id TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, approved_at TEXT);
CREATE TABLE IF NOT EXISTS proposals (id TEXT PRIMARY KEY, pair_id TEXT NOT NULL, url TEXT NOT NULL, title TEXT, authors TEXT, published_date TEXT, license_url TEXT, permission_note TEXT, permission_note_date TEXT, sector TEXT NOT NULL, license_verdict TEXT NOT NULL, selected INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS config_entries (id TEXT PRIMARY KEY, kind TEXT NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS change_log (id TEXT PRIMARY KEY, entity TEXT NOT NULL, entity_id TEXT NOT NULL, before TEXT, after TEXT NOT NULL, changed_at TEXT NOT NULL, changed_by TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cockpit_approvals (id TEXT PRIMARY KEY, paper_title TEXT NOT NULL, proposed_at TEXT NOT NULL, leader_approved INTEGER NOT NULL DEFAULT 0, deputy_approved INTEGER NOT NULL DEFAULT 0, links_opened INTEGER NOT NULL DEFAULT 0, total_links INTEGER NOT NULL, opened_links INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS pending_items (id TEXT PRIMARY KEY, label TEXT NOT NULL, status TEXT NOT NULL, draft_message TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS camps (id TEXT PRIMARY KEY, name TEXT NOT NULL, start_date TEXT, end_date TEXT);
CREATE TABLE IF NOT EXISTS matching_members (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS matching_pairs (id TEXT PRIMARY KEY, axis_id TEXT NOT NULL, member_one TEXT NOT NULL, member_two TEXT NOT NULL, explanation TEXT NOT NULL, approved INTEGER NOT NULL DEFAULT 0, override INTEGER NOT NULL DEFAULT 0, override_reason TEXT);
CREATE TABLE IF NOT EXISTS matching_groups (id TEXT PRIMARY KEY, member_ids TEXT NOT NULL, head_id TEXT NOT NULL, explanation TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS matching_state (id TEXT PRIMARY KEY, leader_approved INTEGER NOT NULL DEFAULT 0, deputy_approved INTEGER NOT NULL DEFAULT 0, swap_window_end TEXT, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS matching_notifications (id TEXT PRIMARY KEY, member_id TEXT NOT NULL, message TEXT NOT NULL, created_at TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS glossary_entries (term_en TEXT PRIMARY KEY, term_ar TEXT NOT NULL, notes TEXT);
CREATE TABLE IF NOT EXISTS paper_drafts (id TEXT PRIMARY KEY, input_json TEXT NOT NULL, body TEXT NOT NULL, word_count INTEGER NOT NULL, within_page_range INTEGER NOT NULL, approved INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS draft_reviews (draft_id TEXT PRIMARY KEY, checklist_json TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS publishing_artifacts (id TEXT PRIMARY KEY, kind TEXT NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS publishing_approvals (kind TEXT PRIMARY KEY, approved INTEGER NOT NULL DEFAULT 0, approved_by TEXT, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reviewer_assignments (paper_id TEXT PRIMARY KEY, reviewer_ids TEXT NOT NULL, updated_at TEXT NOT NULL);
`;

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function dbPath(): string {
  const configured = privateDataPath(process.env.DATABASE_URL);
  const mode = getAppMode();
  const path = process.env.DATABASE_URL ? resolve(process.cwd(), configured) : resolve(process.cwd(), `private/${mode}.sqlite`);
  if (!path.includes(`${resolve(process.cwd(), "private")}/`)) return resolve(process.cwd(), "private/sdc.sqlite");
  return path;
}

export function getDatabase(): DatabaseSync {
  if (!database) {
    const path = dbPath();
    mkdirSync(dirname(path), { recursive: true });
    database = new DatabaseSync(path);
    database.exec(schemaSql);
  }
  seedDatabase(database);
  return database;
}

export function seedDatabase(db = getDatabase()): void {
  const count = Number((db.prepare("SELECT COUNT(*) AS count FROM users").get() as { count: number }).count);
  if (count > 0) { seedSupplemental(db); return; }
  if (getAppMode() === "private") {
    const csvPath = process.env.PRIVATE_MEMBERS_CSV ? resolve(process.cwd(), privateDataPath(process.env.PRIVATE_MEMBERS_CSV)) : resolve(process.cwd(), "private/members.csv");
    try { importPrivateMembers(db, csvPath); } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    return;
  }
  const now = new Date().toISOString();
  const insertUser = db.prepare("INSERT INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)");
  insertUser.run("leader-01", "عبدالله التجريبي", "leader.demo@example.test", "leader", now);
  insertUser.run("deputy-01", "مرام التجريبية", "deputy.demo@example.test", "deputy", now);
  for (let index = 1; index <= 3; index += 1) insertUser.run(`coord-${String(index).padStart(2, "0")}`, `المنسق التجريبي ${index}`, `coord${index}.demo@example.test`, "coordinator", now);
  for (let index = 1; index <= 15; index += 1) {
    insertUser.run(`pair-${String(index).padStart(2, "0")}-a`, `باحث تجريبي ${index} أ`, `pair${index}a.demo@example.test`, "pair", now);
    insertUser.run(`pair-${String(index).padStart(2, "0")}-b`, `باحث تجريبي ${index} ب`, `pair${index}b.demo@example.test`, "pair", now);
  }
  for (let index = 1; index <= 18; index += 1) insertUser.run(`reviewer-${String(index).padStart(2, "0")}`, `مراجع تجريبي ${index}`, `reviewer${index}.demo@example.test`, "reviewer", now);
  const insertAxis = db.prepare("INSERT INTO axes (id, name_ar, name_en) VALUES (?, ?, ?)");
  for (const axis of seedConfig.axes) insertAxis.run(axis.id, axis.nameAr, axis.nameEn);
  const insertPair = db.prepare("INSERT INTO pairs (id, axis_id, coordinator_id) VALUES (?, ?, ?)");
  for (let index = 1; index <= 15; index += 1) insertPair.run(`pair-${String(index).padStart(2, "0")}`, `a${((index - 1) % 3) + 1}`, `coord-${String(((index - 1) % 3) + 1).padStart(2, "0")}`);
  const insertGroup = db.prepare("INSERT INTO review_groups (id, name, head_id) VALUES (?, ?, ?)");
  for (let index = 1; index <= 4; index += 1) insertGroup.run(`group-${index}`, `مجموعة مراجعة ${index}`, `reviewer-${String(index).padStart(2, "0")}`);
  const cycleId = "cycle-2026-11";
  db.prepare("INSERT INTO cycles (id, start_date, end_date, status) VALUES (?, ?, ?, ?)").run(cycleId, seedConfig.plan.cycleStart, addDays(seedConfig.plan.cycleStart, 27), "active");
  const insertTask = db.prepare("INSERT INTO cycle_tasks (id, cycle_id, name, due_date, status) VALUES (?, ?, ?, ?, ?)");
  for (const milestone of generateCycleCalendar(seedConfig.plan.cycleStart)) insertTask.run(`task-${milestone.id}`, cycleId, milestone.labelAr, milestone.dueDate, "open");
  const insertPaper = db.prepare("INSERT INTO papers (id, cycle_id, pair_id, title, sector, license_verdict) VALUES (?, ?, ?, ?, ?, ?)");
  const insertDeliverable = db.prepare("INSERT INTO deliverables (id, paper_id, kind, status, approved_at) VALUES (?, ?, ?, ?, ?)");
  for (const paper of demoPapers) {
    insertPaper.run(paper.id, cycleId, `pair-${String(paper.pair).padStart(2, "0")}`, paper.titleAr, paper.sector, paper.license);
    insertDeliverable.run(`${paper.id}-translation`, paper.id, "translation", paper.translation, paper.translation === "approved" ? now : null);
    insertDeliverable.run(`${paper.id}-summary`, paper.id, "summary", paper.summary, paper.summary === "approved" ? now : null);
  }
  const insertProposal = db.prepare("INSERT INTO proposals (id, pair_id, url, title, sector, license_verdict, selected) VALUES (?, ?, ?, ?, ?, ?, ?)");
  for (let index = 1; index <= 15; index += 1) for (const suffix of ["a", "b"]) insertProposal.run(`proposal-${String(index).padStart(2, "0")}-${suffix}`, `pair-${String(index).padStart(2, "0")}`, `https://example.test/demo/paper-${String(index).padStart(2, "0")}-${suffix}`, `اقتراح تجريبي ${index}${suffix}`, demoPapers[index - 1].sector, "reject", 0);
  const insertConfig = db.prepare("INSERT INTO config_entries (id, kind, value, updated_at) VALUES (?, ?, ?, ?)");
  for (const [kind, value] of Object.entries(seedConfig)) insertConfig.run(`config-${kind}`, kind, JSON.stringify(value), now);
  seedSupplemental(db);
}

function seedSupplemental(db: DatabaseSync): void {
  if (Number((db.prepare("SELECT COUNT(*) AS count FROM cockpit_approvals").get() as { count: number }).count) === 0) db.prepare("INSERT INTO cockpit_approvals (id, paper_title, proposed_at, total_links) VALUES (?, ?, ?, ?)").run("approval-demo", "بحث تجريبي 01: تطبيقات الذكاء الاصطناعي الموثوقة", "2026-11-01T08:00:00Z", 2);
  if (Number((db.prepare("SELECT COUNT(*) AS count FROM pending_items").get() as { count: number }).count) === 0) {
    const insert = db.prepare("INSERT INTO pending_items (id, label, status, draft_message) VALUES (?, ?, ?, ?)");
    for (const item of seedConfig.pendingApprovals) insert.run(item.id, item.nameAr, item.status, `هلا جود، حبيت أتابع معك اعتماد ${item.nameAr} عشان نقدر نبدأ دورة البحث بشكل مرتب 🤍`);
  }
  if (Number((db.prepare("SELECT COUNT(*) AS count FROM camps").get() as { count: number }).count) === 0) db.prepare("INSERT INTO camps (id, name) VALUES (?, ?)").run("camp-q1", "معسكر 1: أساسيات البيانات");
}

export type StoredPaper = { id: string; titleAr: string; axis: string; pair: number; sector: string; license: DemoPaper["license"]; translation: FileStatus; summary: FileStatus; dueDate: string; complete: boolean };

export function listStoredPapers(): StoredPaper[] {
  const db = getDatabase();
  const rows = db.prepare(`SELECT p.id, p.title, p.sector, p.license_verdict, p.pair_id, d.kind, d.status, t.due_date FROM papers p JOIN deliverables d ON d.paper_id = p.id JOIN cycle_tasks t ON t.id = 'task-files-due' ORDER BY p.id`).all() as Array<{ id: string; title: string; sector: string; license_verdict: string; pair_id: string; kind: string; status: FileStatus; due_date: string }>;
  const grouped = new Map<string, StoredPaper>();
  for (const row of rows) {
    const current = grouped.get(row.id) ?? { id: row.id, titleAr: row.title, axis: `a${(Number(row.pair_id.slice(-2)) - 1) % 3 + 1}`, pair: Number(row.pair_id.slice(-2)), sector: row.sector, license: row.license_verdict as DemoPaper["license"], translation: "not_started" as FileStatus, summary: "not_started" as FileStatus, dueDate: row.due_date, complete: false };
    if (row.kind === "translation") current.translation = row.status;
    if (row.kind === "summary") current.summary = row.status;
    current.complete = current.translation === "approved" && current.summary === "approved";
    grouped.set(row.id, current);
  }
  return [...grouped.values()];
}

export function updateDeliverableStatus(paperId: string, kind: "translation" | "summary", status: FileStatus): StoredPaper[] {
  const db = getDatabase();
  db.prepare("UPDATE deliverables SET status = ?, approved_at = ? WHERE paper_id = ? AND kind = ?").run(status, status === "approved" ? new Date().toISOString() : null, paperId, kind);
  return listStoredPapers();
}

export type StoredProposal = { id: string; pairId: string; url: string; title?: string; authors?: string; publishedDate?: string; licenseUrl?: string; permissionNote?: string; permissionNoteDate?: string; sector: string; licenseVerdict: string; selected: boolean };

export function saveProposal(proposal: Omit<StoredProposal, "id">): StoredProposal {
  const id = `proposal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  getDatabase().prepare("INSERT INTO proposals (id, pair_id, url, title, authors, published_date, license_url, permission_note, permission_note_date, sector, license_verdict, selected) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, proposal.pairId, proposal.url, proposal.title ?? null, proposal.authors ?? null, proposal.publishedDate ?? null, proposal.licenseUrl ?? null, proposal.permissionNote ?? null, proposal.permissionNoteDate ?? null, proposal.sector, proposal.licenseVerdict, proposal.selected ? 1 : 0);
  return { id, ...proposal };
}

export function listStoredProposals(): StoredProposal[] {
  const rows = getDatabase().prepare("SELECT * FROM proposals ORDER BY rowid DESC").all() as Array<{ id: string; pair_id: string; url: string; title?: string; authors?: string; published_date?: string; license_url?: string; permission_note?: string; permission_note_date?: string; sector: string; license_verdict: string; selected: number }>;
  return rows.map((row) => ({ id: row.id, pairId: row.pair_id, url: row.url, title: row.title ?? undefined, authors: row.authors ?? undefined, publishedDate: row.published_date ?? undefined, licenseUrl: row.license_url ?? undefined, permissionNote: row.permission_note ?? undefined, permissionNoteDate: row.permission_note_date ?? undefined, sector: row.sector, licenseVerdict: row.license_verdict, selected: Boolean(row.selected) }));
}

export function getPlanSnapshot(): Record<string, unknown> {
  const snapshot: Record<string, unknown> = { ...seedConfig };
  for (const row of getDatabase().prepare("SELECT kind, value FROM config_entries").all() as Array<{ kind: string; value: string }>) {
    try { snapshot[row.kind] = JSON.parse(row.value) as unknown; } catch { snapshot[row.kind] = row.value; }
  }
  return snapshot;
}

export function updatePlanEntry(kind: string, value: unknown, changedBy = "demo-leader"): Record<string, unknown> {
  const db = getDatabase();
  const current = getPlanSnapshot()[kind] ?? null;
  const serialized = JSON.stringify(value);
  const now = new Date().toISOString();
  db.prepare("INSERT INTO config_entries (id, kind, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").run(`config-${kind}`, kind, serialized, now);
  db.prepare("INSERT INTO change_log (id, entity, entity_id, before, after, changed_at, changed_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(`change-${Date.now()}`, "config", kind, JSON.stringify(current), serialized, now, changedBy);
  return getPlanSnapshot();
}

export function rollbackPlanEntry(kind: string, changedBy = "demo-leader"): Record<string, unknown> {
  const db = getDatabase();
  const change = db.prepare("SELECT id, before, after FROM change_log WHERE entity = 'config' AND entity_id = ? ORDER BY changed_at DESC LIMIT 1").get(kind) as { id: string; before: string | null; after: string } | undefined;
  if (!change || change.before === null) return getPlanSnapshot();
  const previous = JSON.parse(change.before) as unknown;
  return updatePlanEntry(kind, previous, changedBy);
}

export type ApprovalRecord = { id: string; paperTitle: string; proposedAt: string; leaderApproved: boolean; deputyApproved: boolean; linksOpened: boolean; totalLinks: number; openedLinks: number };
export type PendingRecord = { id: string; label: string; status: string; draftMessage: string };
export type CampRecord = { id: string; name: string; startDate?: string; endDate?: string };

export function getLeadershipState(): { approval: ApprovalRecord; pending: PendingRecord[] } {
  const db = getDatabase();
  const row = db.prepare("SELECT * FROM cockpit_approvals LIMIT 1").get() as { id: string; paper_title: string; proposed_at: string; leader_approved: number; deputy_approved: number; links_opened: number; total_links: number; opened_links: number } | undefined;
  const pending = db.prepare("SELECT * FROM pending_items ORDER BY id").all() as Array<{ id: string; label: string; status: string; draft_message: string }>;
  return { approval: row ? { id: row.id, paperTitle: row.paper_title, proposedAt: row.proposed_at, leaderApproved: Boolean(row.leader_approved), deputyApproved: Boolean(row.deputy_approved), linksOpened: Boolean(row.links_opened), totalLinks: row.total_links, openedLinks: row.opened_links } : { id: "", paperTitle: "", proposedAt: "", leaderApproved: false, deputyApproved: false, linksOpened: false, totalLinks: 0, openedLinks: 0 }, pending: pending.map((item) => ({ id: item.id, label: item.label, status: item.status, draftMessage: item.draft_message })) };
}

export function updateLeadershipState(input: { approval?: Partial<ApprovalRecord>; pendingId?: string; pendingStatus?: string }): { approval: ApprovalRecord; pending: PendingRecord[] } {
  const db = getDatabase();
  if (input.approval) {
    const approval = input.approval;
    const fields: string[] = []; const values: number[] = [];
    for (const [key, column] of [["leaderApproved", "leader_approved"], ["deputyApproved", "deputy_approved"], ["linksOpened", "links_opened"]] as const) if (typeof approval[key] === "boolean") { fields.push(`${column} = ?`); values.push(approval[key] ? 1 : 0); }
    if (fields.length > 0) db.prepare(`UPDATE cockpit_approvals SET ${fields.join(", ")} WHERE id = 'approval-demo'`).run(...values);
  }
  if (input.pendingId && input.pendingStatus) db.prepare("UPDATE pending_items SET status = ? WHERE id = ?").run(input.pendingStatus, input.pendingId);
  return getLeadershipState();
}

export function listCamps(): CampRecord[] { return (getDatabase().prepare("SELECT id, name, start_date, end_date FROM camps ORDER BY id").all() as Array<{ id: string; name: string; start_date?: string; end_date?: string }>).map((camp) => ({ id: camp.id, name: camp.name, startDate: camp.start_date ?? undefined, endDate: camp.end_date ?? undefined })); }
export function updateCamp(id: string, startDate?: string, endDate?: string): CampRecord[] { getDatabase().prepare("UPDATE camps SET start_date = ?, end_date = ? WHERE id = ?").run(startDate ?? null, endDate ?? null, id); return listCamps(); }

export type MatchingNotification = { id: string; memberId: string; message: string; createdAt: string; read: boolean };
export type MatchingState = { members: PollResponse[]; result: MatchingResult; leaderApproved: boolean; deputyApproved: boolean; swapWindowEnd?: string; notifications: MatchingNotification[] };
export function getNonResponders(existingIds: string[]): PollResponse[] {
  const known = new Set(existingIds); const rows = getDatabase().prepare("SELECT id, name, email, role FROM users WHERE role IN ('pair', 'reviewer') ORDER BY id").all() as Array<{ id: string; name: string; email: string; role: string }>;
  return rows.filter((row) => !known.has(row.id)).map((row) => ({ id: row.id, name: row.name, email: row.email, axisRanking: ["a1", "a2", "a3"], trackPreference: row.role === "reviewer" ? "review" : "pair", secondTrack: row.role === "reviewer" ? "pair" : "review", sectors: [], reading: 3, translation: 3, arabicWriting: 3, technical: 3, threadWriting: 3, priorTranslation: false, weeklyHours: 3, leadershipInterest: false, nonResponder: true }));
}
export function saveMatchingRun(members: PollResponse[], result: MatchingResult): MatchingState {
  const db = getDatabase(); const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM matching_members; DELETE FROM matching_pairs; DELETE FROM matching_groups; DELETE FROM matching_state;");
    const insertMember = db.prepare("INSERT INTO matching_members (id, name, email, payload) VALUES (?, ?, ?, ?)");
    for (const member of members) insertMember.run(member.id, member.name, member.email, JSON.stringify(member));
    const insertPair = db.prepare("INSERT INTO matching_pairs (id, axis_id, member_one, member_two, explanation, approved, override, override_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const pair of result.pairs) insertPair.run(pair.id, pair.axisId, pair.memberIds[0], pair.memberIds[1], pair.explanation, pair.approved ? 1 : 0, pair.override ? 1 : 0, null);
    const insertGroup = db.prepare("INSERT INTO matching_groups (id, member_ids, head_id, explanation) VALUES (?, ?, ?, ?)");
    for (const group of result.reviewGroups) insertGroup.run(group.id, JSON.stringify(group.memberIds), group.headId, group.explanation);
    db.prepare("INSERT INTO matching_state (id, updated_at) VALUES ('current', ?)").run(now); db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return getMatchingState();
}

export function getMatchingState(): MatchingState {
  const db = getDatabase();
  const members = (db.prepare("SELECT payload FROM matching_members ORDER BY id").all() as Array<{ payload: string }>).map((row) => JSON.parse(row.payload) as PollResponse);
  const pairs = (db.prepare("SELECT * FROM matching_pairs ORDER BY id").all() as Array<{ id: string; axis_id: string; member_one: string; member_two: string; explanation: string; approved: number; override: number }>).map((row) => ({ id: row.id, axisId: row.axis_id, memberIds: [row.member_one, row.member_two], explanation: row.explanation, approved: Boolean(row.approved), override: Boolean(row.override) }));
  const reviewGroups = (db.prepare("SELECT * FROM matching_groups ORDER BY id").all() as Array<{ id: string; member_ids: string; head_id: string; explanation: string }>).map((row) => ({ id: row.id, memberIds: JSON.parse(row.member_ids) as string[], headId: row.head_id, explanation: row.explanation }));
  const state = db.prepare("SELECT leader_approved, deputy_approved, swap_window_end FROM matching_state WHERE id = 'current'").get() as { leader_approved: number; deputy_approved: number; swap_window_end?: string } | undefined;
  const notifications = (db.prepare("SELECT id, member_id, message, created_at, read FROM matching_notifications ORDER BY created_at DESC").all() as Array<{ id: string; member_id: string; message: string; created_at: string; read: number }>).map((item) => ({ id: item.id, memberId: item.member_id, message: item.message, createdAt: item.created_at, read: Boolean(item.read) }));
  return { members, result: { pairs, reviewGroups, warnings: [] }, leaderApproved: Boolean(state?.leader_approved), deputyApproved: Boolean(state?.deputy_approved), swapWindowEnd: state?.swap_window_end ?? undefined, notifications };
}

export function updateMatchingState(input: { leaderApproved?: boolean; deputyApproved?: boolean; pairId?: string; memberIds?: string[]; reason?: string }): MatchingState {
  const db = getDatabase(); const current = getMatchingState();
  if (input.pairId && input.memberIds?.length === 2 && input.reason?.trim()) { const old = current.result.pairs.find((pair) => pair.id === input.pairId); db.prepare("UPDATE matching_pairs SET member_one = ?, member_two = ?, override = 1, override_reason = ? WHERE id = ?").run(input.memberIds[0], input.memberIds[1], input.reason.trim(), input.pairId); const message = `تم تعديل توزيعك في ${input.pairId}. السبب: ${input.reason.trim()}`; for (const memberId of new Set([...(old?.memberIds ?? []), ...input.memberIds])) db.prepare("INSERT INTO matching_notifications (id, member_id, message, created_at) VALUES (?, ?, ?, ?)").run(`matching-note-${Date.now()}-${memberId}`, memberId, message, new Date().toISOString()); }
  const leader = input.leaderApproved ?? current.leaderApproved; const deputy = input.deputyApproved ?? current.deputyApproved; const windowEnd = leader && deputy ? (current.swapWindowEnd ?? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()) : current.swapWindowEnd ?? null;
  db.prepare("UPDATE matching_state SET leader_approved = ?, deputy_approved = ?, swap_window_end = ?, updated_at = ? WHERE id = 'current'").run(leader ? 1 : 0, deputy ? 1 : 0, windowEnd, new Date().toISOString());
  return getMatchingState();
}

export type StoredDraft = { id: string; input: DraftInput; glossary: GlossaryEntry[]; draft: DraftResult };
export function saveDraftRecord(input: DraftInput, draft: DraftResult, glossary: GlossaryEntry[]): StoredDraft {
  const db = getDatabase(); const now = new Date().toISOString();
  db.exec("BEGIN");
  try {
    db.exec("DELETE FROM glossary_entries;"); const insertGlossary = db.prepare("INSERT INTO glossary_entries (term_en, term_ar, notes) VALUES (?, ?, ?)");
    for (const entry of glossary) insertGlossary.run(entry.termEn, entry.termAr, entry.notes ?? null);
    db.prepare("INSERT INTO paper_drafts (id, input_json, body, word_count, within_page_range, approved, updated_at) VALUES ('draft-current', ?, ?, ?, ?, 0, ?) ON CONFLICT(id) DO UPDATE SET input_json=excluded.input_json, body=excluded.body, word_count=excluded.word_count, within_page_range=excluded.within_page_range, approved=0, updated_at=excluded.updated_at").run(JSON.stringify(input), draft.body, draft.wordCount, draft.withinPageRange ? 1 : 0, now);
    db.prepare("INSERT INTO draft_reviews (draft_id, checklist_json, updated_at) VALUES ('draft-current', ?, ?) ON CONFLICT(draft_id) DO UPDATE SET checklist_json=excluded.checklist_json, updated_at=excluded.updated_at").run(JSON.stringify(draft.checklist), now); db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return getDraftRecord() as StoredDraft;
}
export function getDraftRecord(): StoredDraft | null {
  const db = getDatabase(); const row = db.prepare("SELECT * FROM paper_drafts WHERE id = 'draft-current'").get() as { id: string; input_json: string; body: string; word_count: number; within_page_range: number; approved: number } | undefined; if (!row) return null;
  const input = JSON.parse(row.input_json) as DraftInput; const glossary = (db.prepare("SELECT term_en, term_ar, notes FROM glossary_entries ORDER BY term_en").all() as Array<{ term_en: string; term_ar: string; notes?: string }>).map((entry) => ({ termEn: entry.term_en, termAr: entry.term_ar, notes: entry.notes ?? undefined })); const review = db.prepare("SELECT checklist_json FROM draft_reviews WHERE draft_id = 'draft-current'").get() as { checklist_json: string } | undefined; const checklist = review ? JSON.parse(review.checklist_json) as DraftChecklist : { sourceOpened: false, licenseVerified: false, translationReviewed: false, summaryReviewed: false, scientificReview: false, languageReview: false }; return { id: row.id, input, glossary, draft: { body: row.body, wordCount: row.word_count, withinPageRange: Boolean(row.within_page_range), glossaryUsed: glossary, draftLabel: "DRAFT (مسودة)", checklist, approved: Boolean(row.approved) } };
}
export function updateDraftReview(checklist: DraftChecklist, approved: boolean): StoredDraft | null { const current = getDraftRecord(); if (!current) return null; const allowed = approved && current.draft.withinPageRange && Object.values(checklist).every(Boolean); const now = new Date().toISOString(); const db = getDatabase(); db.prepare("UPDATE paper_drafts SET approved = ?, updated_at = ? WHERE id = 'draft-current'").run(allowed ? 1 : 0, now); db.prepare("UPDATE draft_reviews SET checklist_json = ?, updated_at = ? WHERE draft_id = 'draft-current'").run(JSON.stringify(checklist), now); return getDraftRecord(); }

export type PublishingState = { artifacts: Record<string, unknown>; approvals: Record<string, { approved: boolean; approvedBy?: string }>; assignments: Array<{ paperId: string; reviewerIds: string[] }> };
export function savePublishingState(artifacts: Record<string, unknown>, assignments: Array<{ paperId: string; reviewerIds: string[] }>): PublishingState { const db = getDatabase(); const now = new Date().toISOString(); db.exec("BEGIN"); try { for (const [kind, value] of Object.entries(artifacts)) db.prepare("INSERT INTO publishing_artifacts (id, kind, value, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at").run(`artifact-${kind}`, kind, JSON.stringify(value), now); db.exec("DELETE FROM reviewer_assignments;"); const insert = db.prepare("INSERT INTO reviewer_assignments (paper_id, reviewer_ids, updated_at) VALUES (?, ?, ?)"); for (const assignment of assignments) insert.run(assignment.paperId, JSON.stringify(assignment.reviewerIds), now); db.exec("COMMIT"); } catch (error) { db.exec("ROLLBACK"); throw error; } return getPublishingState(); }
export function getPublishingState(): PublishingState { const db = getDatabase(); const artifacts: Record<string, unknown> = {}; for (const row of db.prepare("SELECT kind, value FROM publishing_artifacts").all() as Array<{ kind: string; value: string }>) artifacts[row.kind] = JSON.parse(row.value) as unknown; const approvals: Record<string, { approved: boolean; approvedBy?: string }> = {}; for (const row of db.prepare("SELECT kind, approved, approved_by FROM publishing_approvals").all() as Array<{ kind: string; approved: number; approved_by?: string }>) approvals[row.kind] = { approved: Boolean(row.approved), approvedBy: row.approved_by ?? undefined }; const assignments = (db.prepare("SELECT paper_id, reviewer_ids FROM reviewer_assignments ORDER BY paper_id").all() as Array<{ paper_id: string; reviewer_ids: string }>).map((row) => ({ paperId: row.paper_id, reviewerIds: JSON.parse(row.reviewer_ids) as string[] })); return { artifacts, approvals, assignments }; }
export function updatePublishingApproval(kind: string, approved: boolean, approvedBy: string): PublishingState { const db = getDatabase(); db.prepare("INSERT INTO publishing_approvals (kind, approved, approved_by, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(kind) DO UPDATE SET approved=excluded.approved, approved_by=excluded.approved_by, updated_at=excluded.updated_at").run(kind, approved ? 1 : 0, approvedBy, new Date().toISOString()); return getPublishingState(); }
