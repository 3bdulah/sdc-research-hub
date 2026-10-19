import { readFileSync } from "node:fs";
import type { DatabaseSync } from "node:sqlite";

export type PrivateMemberRow = { id: string; name: string; email: string; role: string };

function parseLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (const character of line) {
    if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += character;
  }
  cells.push(cell.trim());
  return cells;
}

export function parseMembersCsv(csv: string): PrivateMemberRow[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = parseLine(lines[0]).map((header) => header.toLowerCase());
  const required = ["id", "name", "email", "role"];
  if (!required.every((header) => headers.includes(header))) throw new Error("Private CSV must contain id,name,email,role columns.");
  return lines.slice(1).map((line) => {
    const cells = parseLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
    if (!row.id || !row.name || !row.email || !row.role) throw new Error("Private CSV contains an incomplete member row.");
    return { id: row.id, name: row.name, email: row.email, role: row.role };
  });
}

export function importPrivateMembers(db: DatabaseSync, csvPath: string): number {
  const rows = parseMembersCsv(readFileSync(csvPath, "utf8"));
  const insert = db.prepare("INSERT OR REPLACE INTO users (id, name, email, role, created_at) VALUES (?, ?, ?, ?, ?)");
  const now = new Date().toISOString();
  for (const row of rows) insert.run(row.id, row.name, row.email, row.role, now);
  return rows.length;
}
