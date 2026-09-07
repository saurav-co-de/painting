import { existsSync, readFileSync } from "node:fs";
import { Pool } from "pg";

const envFile = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";

for (const line of envFile.split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);

  if (match && !process.env[match[1]]) {
    process.env[match[1]] = match[2];
  }
}

if (!process.env.DATABASE_URL) {
  console.log(JSON.stringify({ error: "DATABASE_URL not set" }, null, 2));
  process.exit(0);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false }
});

try {
  const tables = await pool.query(
    `
      select
        n.nspname as schema,
        c.relname as table,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.relkind = 'r'
        and n.nspname not in ('pg_catalog', 'information_schema')
      order by 1, 2
    `
  );

  const policies = await pool.query(
    `
      select
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      from pg_policies
      order by 1, 2, 3
    `
  );

  const columns = await pool.query(
    `
      select
        table_name,
        column_name,
        data_type,
        is_nullable
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    `
  );

  const grants = await pool.query(
    `
      select
        table_name,
        grantee,
        privilege_type
      from information_schema.role_table_grants
      where table_schema = 'public'
        and grantee in ('anon', 'authenticated', 'service_role', 'public')
      order by table_name, grantee, privilege_type
    `
  );

  console.log(
    JSON.stringify(
      {
        tables: tables.rows,
        policies: policies.rows,
        columns: columns.rows,
        grants: grants.rows
      },
      null,
      2
    )
  );
} catch (error) {
  console.error(JSON.stringify({ error: error.message, code: error.code }, null, 2));
  process.exitCode = 1;
} finally {
  await pool.end();
}
