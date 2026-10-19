import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { seedConfig } from "@/lib/config";
import { demoPapers, type DemoPaper, type FileStatus } from "@/lib/demo-data";
import { getAppMode, privateDataPath } from "@/lib/mode";
import { importPrivateMembers } from "@/lib/db/private-import";
import { generateCycleCalendar } from "@/lib/cycle";

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
  if (count > 0) return;
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
  const id = `proposal-${Date.now()}`;
  getDatabase().prepare("INSERT INTO proposals (id, pair_id, url, title, authors, published_date, license_url, permission_note, permission_note_date, sector, license_verdict, selected) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, proposal.pairId, proposal.url, proposal.title ?? null, proposal.authors ?? null, proposal.publishedDate ?? null, proposal.licenseUrl ?? null, proposal.permissionNote ?? null, proposal.permissionNoteDate ?? null, proposal.sector, proposal.licenseVerdict, proposal.selected ? 1 : 0);
  return { id, ...proposal };
}
