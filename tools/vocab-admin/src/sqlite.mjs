import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export function runSql(dbPath, sql) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlPath = writeTempSql(sql);
  try {
    execFileSync("sqlite3", [dbPath, `.read ${sqlPath}`], { encoding: "utf8" });
  } finally {
    fs.rmSync(sqlPath, { force: true });
  }
}

export function querySql(dbPath, sql) {
  if (!fs.existsSync(dbPath)) return [];
  const output = execFileSync("sqlite3", ["-json", dbPath, sql], { encoding: "utf8" });
  return output.trim() ? JSON.parse(output) : [];
}

export function sqlString(value) {
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function writeTempSql(sql) {
  const sqlPath = path.join(os.tmpdir(), `pinu-vocab-${process.pid}-${Date.now()}-${Math.random()}.sql`);
  fs.writeFileSync(sqlPath, sql, "utf8");
  return sqlPath;
}
