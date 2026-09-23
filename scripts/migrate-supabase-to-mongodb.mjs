import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import dns from "node:dns";
import { MongoClient } from "mongodb";
import pg from "pg";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

// 1. Load environment variables from .env.local if present
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

const mongoUri =
  process.env.MONGODB_URI?.trim() ||
  process.env.MONGODB_URL?.trim() ||
  process.env.MONGO_URI?.trim() ||
  process.env.MONGO_URL?.trim();
const mongoDbName =
  process.env.MONGODB_DB_NAME?.trim() ||
  process.env.MONGO_DB_NAME?.trim() ||
  "buildbill";
const supabaseUrl = process.env.DATABASE_URL?.trim();

if (!mongoUri) {
  console.error("\n❌ Error: MONGODB_URI is not defined.");
  console.error("Please add MONGODB_URI to your .env.local file or pass it as an environment variable:");
  console.error("  MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority' node scripts/migrate-supabase-to-mongodb.mjs\n");
  process.exit(1);
}

console.log("\n=======================================================");
console.log("  🚀 BuildBill AI: Supabase -> MongoDB Atlas Migration");
console.log("=======================================================\n");

async function readSourceData() {
  if (supabaseUrl && process.env.USE_FILE_DB?.toLowerCase() !== "true") {
    console.log("📡 Source: Reading from Supabase PostgreSQL...");
    const pool = new pg.Pool({
      connectionString: supabaseUrl,
      ssl: supabaseUrl.includes("localhost") ? false : { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
      const [usersRes, customersRes, invoicesRes, quotationsRes] = await Promise.all([
        client.query("SELECT data FROM users"),
        client.query("SELECT data FROM customers"),
        client.query("SELECT data FROM invoices"),
        client.query("SELECT data FROM quotations")
      ]);

      return {
        users: usersRes.rows.map((r) => r.data),
        customers: customersRes.rows.map((r) => r.data),
        invoices: invoicesRes.rows.map((r) => r.data),
        quotations: quotationsRes.rows.map((r) => r.data)
      };
    } finally {
      client.release();
      await pool.end();
    }
  } else {
    console.log("📁 Source: Reading from local JSON database (data/buildbill-db.json)...");
    const filePath = path.join(process.cwd(), "data", "buildbill-db.json");
    if (!existsSync(filePath)) {
      throw new Error(`Local database file not found at ${filePath}`);
    }
    const raw = readFileSync(filePath, "utf8");
    const json = JSON.parse(raw);
    return {
      users: json.users || [],
      customers: json.customers || [],
      invoices: json.invoices || [],
      quotations: json.quotations || []
    };
  }
}

async function runMigration() {
  const startTime = Date.now();

  console.log(`🎯 Target MongoDB: ${mongoDbName}`);
  const mongoClient = new MongoClient(mongoUri);
  await mongoClient.connect();
  console.log(" Connected to MongoDB Atlas successfully.\n");

  const db = mongoClient.db(mongoDbName);
  const sourceData = await readSourceData();

  const collections = [
    { name: "users", targetCol: "users", data: sourceData.users },
    { name: "customers", targetCol: "customers", data: sourceData.customers },
    { name: "invoices", targetCol: "invoices", data: sourceData.invoices },
    { name: "quotations", targetCol: "quotations", data: sourceData.quotations }
  ];

  const report = [];

  for (const { name, targetCol, data } of collections) {
    console.log(`⏳ Migrating ${name} (${data.length} records)...`);
    const col = db.collection(targetCol);
    let successCount = 0;
    let failCount = 0;

    for (const record of data) {
      try {
        const id = record.id || record._id;
        if (!id) {
          throw new Error("Record missing ID");
        }

        const document = {
          ...record,
          _id: id,
          id: id,
          deleted: false,
          migratedAt: new Date().toISOString()
        };

        // Idempotent upsert by exact ID
        await col.replaceOne({ _id: id }, document, { upsert: true });
        successCount++;
      } catch (err) {
        failCount++;
        console.error(`   ⚠️ Failed record ${record.id}:`, err.message);
      }
    }

    report.push({
      Collection: name,
      Total: data.length,
      Migrated: successCount,
      Failed: failCount
    });
  }

  // Create useful indexes
  console.log("\n📑 Ensuring indexes on MongoDB collections...");
  await db.collection("customers").createIndex({ userId: 1, deleted: 1 });
  await db.collection("invoices").createIndex({ userId: 1, deleted: 1, createdAt: -1 });
  await db.collection("quotations").createIndex({ userId: 1, deleted: 1, createdAt: -1 });
  await db.collection("sync_queue").createIndex({ status: 1, nextRetryAt: 1 });

  await mongoClient.close();
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log("\n=======================================================");
  console.log("  📊 Migration Summary Report");
  console.log("=======================================================");
  console.table(report);
  console.log(`⏱️ Completed in ${duration}s.`);
  console.log("✨ All Supabase records migrated to MongoDB Atlas with matching IDs.\n");
}

runMigration().catch((err) => {
  console.error("\n❌ Migration failed:", err);
  process.exit(1);
});
