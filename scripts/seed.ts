import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
const databasePath = process.env.DATABASE_URL ?? "./private/sdc.sqlite";
mkdirSync(dirname(databasePath), { recursive: true });
console.log(`M0 seed placeholder ready for ${databasePath}. Database migration wiring is reserved for M1.`);
