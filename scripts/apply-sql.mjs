import { existsSync, readFileSync } from "node:fs";
import { Pool } from "pg";

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Usage: node scripts/apply-sql.mjs <sql-file>");
  process.exit(1);
}

const envFile = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";

for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);

  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

try {
  await pool.query(readFileSync(sqlFile, "utf8"));
  console.log(`Applied ${sqlFile}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
