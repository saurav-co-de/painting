import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { calculateInvoice, createInvoiceNumber } from "./billing.js";
import { dualWrite, syncRecordToMongo } from "./database/sync.js";
import { getCollection, isMongoConfigured } from "./database/mongodb.js";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "buildbill-db.json");
const usePostgres =
  Boolean(process.env.DATABASE_URL) && process.env.USE_FILE_DB?.toLowerCase() !== "true";

let pool;
let postgresReady;

function now() {
  return new Date().toISOString();
}

function hashPassword(password, salt = randomUUID()) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, storedHash] = String(storedValue || "").split(":");

  if (!salt || !storedHash) {
    return false;
  }

  const computedHash = scryptSync(password, salt, 64);
  const expectedHash = Buffer.from(storedHash, "hex");

  if (computedHash.length !== expectedHash.length) {
    return false;
  }

  return timingSafeEqual(computedHash, expectedHash);
}

function createSeedDatabase() {
  const demoUserId = randomUUID();
  const customerAId = randomUUID();
  const customerBId = randomUUID();
  const invoiceAId = randomUUID();
  const invoiceBId = randomUUID();

  return {
    users: [
      {
        id: demoUserId,
        name: "Raghav Menon",
        email: "demo@buildbill.ai",
        passwordHash: hashPassword("buildbill123"),
        subscriptionPlan: "Pro",
        role: "business_user",
        businessName: "BuildCraft Interiors",
        gstin: "29ABCDE1234F1Z9",
        address: "24 MG Road, Indiranagar, Bengaluru, Karnataka 560038",
        phone: "+91 98765 43210",
        logoText: "BC",
        accountNumber: "",
        ifscCode: "",
        bankName: "",
        branch: "",
        signatureImage: "",
        createdAt: now()
      }
    ],
    customers: [
      {
        id: customerAId,
        userId: demoUserId,
        customerName: "Avanta Residences",
        gstNumber: "29AACCA9999H1Z7",
        address: "14 Residency Road, Bengaluru, Karnataka 560025",
        mobile: "+91 99880 22110",
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: customerBId,
        userId: demoUserId,
        customerName: "Nexa Paint Works",
        gstNumber: "29AAGCN4567K1Z4",
        address: "18 CMH Road, Bengaluru, Karnataka 560008",
        mobile: "+91 99001 34000",
        createdAt: now(),
        updatedAt: now()
      }
    ],
    invoices: [
      {
        id: invoiceAId,
        userId: demoUserId,
        invoiceNumber: "BB-2026-001",
        invoiceDate: "2026-05-02",
        dueDate: "2026-05-12",
        projectName: "3BHK Interior Renovation",
        taxMode: "intra",
        customerId: customerAId,
        companyDetails: {
          companyName: "BuildCraft Interiors",
          gstin: "29ABCDE1234F1Z9",
          address: "24 MG Road, Indiranagar, Bengaluru, Karnataka 560038",
          phone: "+91 98765 43210",
          email: "accounts@buildcraft.in",
          logoText: "BC"
        },
        customerDetails: {
          clientName: "Avanta Residences",
          gstNumber: "29AACCA9999H1Z7",
          address: "14 Residency Road, Bengaluru, Karnataka 560025",
          mobile: "+91 99880 22110"
        },
        items: [
          {
            description: "Modular wardrobe installation",
            unit: "Nos",
            quantity: 4,
            rate: 18500,
            gstPercentage: 18,
            amount: 74000,
            gstAmount: 13320,
            cgst: 6660,
            sgst: 6660,
            igst: 0
          },
          {
            description: "False ceiling work",
            unit: "Sqft",
            quantity: 650,
            rate: 125,
            gstPercentage: 18,
            amount: 81250,
            gstAmount: 14625,
            cgst: 7312.5,
            sgst: 7312.5,
            igst: 0
          }
        ],
        totals: {
          subtotal: 155250,
          gstTotal: 27945,
          cgstTotal: 13972.5,
          sgstTotal: 13972.5,
          igstTotal: 0,
          grandTotal: 183195
        },
        paymentStatus: "Paid",
        notes: "Thank you for choosing BuildCraft Interiors.",
        terms: "Payment due within 10 days. Material warranty as per manufacturer terms.",
        createdAt: now(),
        updatedAt: now()
      },
      {
        id: invoiceBId,
        userId: demoUserId,
        invoiceNumber: "BB-2026-002",
        invoiceDate: "2026-05-16",
        dueDate: "2026-05-26",
        projectName: "Commercial Exterior Repaint",
        taxMode: "inter",
        customerId: customerBId,
        companyDetails: {
          companyName: "BuildCraft Interiors",
          gstin: "29ABCDE1234F1Z9",
          address: "24 MG Road, Indiranagar, Bengaluru, Karnataka 560038",
          phone: "+91 98765 43210",
          email: "accounts@buildcraft.in",
          logoText: "BC"
        },
        customerDetails: {
          clientName: "Nexa Paint Works",
          gstNumber: "29AAGCN4567K1Z4",
          address: "18 CMH Road, Bengaluru, Karnataka 560008",
          mobile: "+91 99001 34000"
        },
        items: [
          {
            description: "Weather-proof exterior primer and topcoat",
            unit: "Sqft",
            quantity: 1200,
            rate: 68,
            gstPercentage: 18,
            amount: 81600,
            gstAmount: 14688,
            cgst: 0,
            sgst: 0,
            igst: 14688
          },
          {
            description: "High-reach scaffolding and site setup",
            unit: "Nos",
            quantity: 1,
            rate: 40800,
            gstPercentage: 18,
            amount: 40800,
            gstAmount: 7344,
            cgst: 0,
            sgst: 0,
            igst: 7344
          }
        ],
        totals: {
          subtotal: 122400,
          gstTotal: 22032,
          cgstTotal: 0,
          sgstTotal: 0,
          igstTotal: 22032,
          grandTotal: 144432
        },
        paymentStatus: "Pending",
        notes: "Site supervisor to confirm final area measurement after handover.",
        terms: "50% advance received. Balance payable on completion.",
        createdAt: now(),
        updatedAt: now()
      }
    ],
    quotations: []
  };
}

function ensureDatabaseFile() {
  if (!existsSync(dataDirectory)) {
    mkdirSync(dataDirectory, { recursive: true });
  }

  if (!existsSync(databasePath)) {
    writeFileSync(databasePath, JSON.stringify(createSeedDatabase(), null, 2));
  }
}

async function getPool() {
  if (!pool) {
    const { Pool } = await import("pg");

    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 10000,
      ssl: process.env.DATABASE_URL?.includes("localhost")
        ? false
        : { rejectUnauthorized: false }
    });
  }

  return pool;
}

async function ensurePostgresDatabase() {
  if (postgresReady) {
    return postgresReady;
  }

  postgresReady = (async () => {
    const client = await (await getPool()).connect();

    try {
      await client.query("BEGIN");
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS customers (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          data JSONB NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          customer_id TEXT,
          data JSONB NOT NULL
        )
      `);
      await client.query(`
        CREATE TABLE IF NOT EXISTS quotations (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          customer_id TEXT,
          data JSONB NOT NULL
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers (user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices (user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS quotations_user_id_idx ON quotations (user_id)");

      const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM users");

      if (rows[0].count === 0) {
        await writePostgresDatabase(createSeedDatabase(), client);
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  })();

  return postgresReady;
}

async function readPostgresDatabase() {
  await ensurePostgresDatabase();
  const databasePool = await getPool();
  const [usersResult, customersResult, invoicesResult, quotationsResult] = await Promise.all([
    databasePool.query("SELECT data FROM users"),
    databasePool.query("SELECT data FROM customers ORDER BY data->>'createdAt' DESC"),
    databasePool.query("SELECT data FROM invoices ORDER BY data->>'createdAt' DESC"),
    databasePool.query("SELECT data FROM quotations ORDER BY data->>'createdAt' DESC")
  ]);

  return {
    users: usersResult.rows.map((row) => row.data),
    customers: customersResult.rows.map((row) => row.data),
    invoices: invoicesResult.rows.map((row) => row.data),
    quotations: quotationsResult.rows.map((row) => row.data)
  };
}

async function writePostgresDatabase(nextDatabase, existingClient) {
  const client = existingClient || (await (await getPool()).connect());
  const ownsClient = !existingClient;

  try {
    if (ownsClient) {
      await client.query("BEGIN");
    }

    await client.query("DELETE FROM quotations");
    await client.query("DELETE FROM invoices");
    await client.query("DELETE FROM customers");
    await client.query("DELETE FROM users");

    for (const user of nextDatabase.users) {
      await client.query("INSERT INTO users (id, data) VALUES ($1, $2)", [user.id, user]);
    }

    for (const customer of nextDatabase.customers) {
      await client.query(
        "INSERT INTO customers (id, user_id, data) VALUES ($1, $2, $3)",
        [customer.id, customer.userId, customer]
      );
    }

    for (const invoice of nextDatabase.invoices) {
      await client.query(
        "INSERT INTO invoices (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)",
        [invoice.id, invoice.userId, invoice.customerId || null, invoice]
      );
    }

    for (const quotation of nextDatabase.quotations || []) {
      await client.query(
        "INSERT INTO quotations (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)",
        [quotation.id, quotation.userId, quotation.customerId || null, quotation]
      );
    }

    if (ownsClient) {
      await client.query("COMMIT");
    }

    return nextDatabase;
  } catch (error) {
    if (ownsClient) {
      await client.query("ROLLBACK");
    }

    throw error;
  } finally {
    if (ownsClient) {
      client.release();
    }
  }
}

// -------------------------------------------------------------
// MongoDB Failover Read Helpers
// -------------------------------------------------------------
async function findMongoUserById(userId) {
  if (!isMongoConfigured()) return null;
  try {
    const col = await getCollection("users");
    if (!col) return null;
    return await col.findOne({ _id: userId, deleted: { $ne: true } });
  } catch (err) {
    console.error("[Failover Read Error] findMongoUserById:", err.message);
    return null;
  }
}

async function findMongoUserByEmail(email) {
  if (!isMongoConfigured()) return null;
  try {
    const col = await getCollection("users");
    if (!col) return null;
    return await col.findOne({
      $expr: { $eq: [{ $toLower: "$email" }, String(email).toLowerCase()] },
      deleted: { $ne: true }
    });
  } catch (err) {
    console.error("[Failover Read Error] findMongoUserByEmail:", err.message);
    return null;
  }
}

async function listMongoCustomersForUser(userId) {
  if (!isMongoConfigured()) return [];
  try {
    const col = await getCollection("customers");
    if (!col) return [];
    return await col
      .find({ userId, deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (err) {
    console.error("[Failover Read Error] listMongoCustomersForUser:", err.message);
    return [];
  }
}

async function listMongoInvoicesForUser(userId) {
  if (!isMongoConfigured()) return [];
  try {
    const col = await getCollection("invoices");
    if (!col) return [];
    return await col
      .find({ userId, deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (err) {
    console.error("[Failover Read Error] listMongoInvoicesForUser:", err.message);
    return [];
  }
}

async function findMongoInvoiceForUser(userId, invoiceId) {
  if (!isMongoConfigured()) return null;
  try {
    const col = await getCollection("invoices");
    if (!col) return null;
    return await col.findOne({ _id: invoiceId, userId, deleted: { $ne: true } });
  } catch (err) {
    console.error("[Failover Read Error] findMongoInvoiceForUser:", err.message);
    return null;
  }
}

async function listMongoQuotationsForUser(userId) {
  if (!isMongoConfigured()) return [];
  try {
    const col = await getCollection("quotations");
    if (!col) return [];
    return await col
      .find({ userId, deleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();
  } catch (err) {
    console.error("[Failover Read Error] listMongoQuotationsForUser:", err.message);
    return [];
  }
}

async function findMongoQuotationForUser(userId, quotationId) {
  if (!isMongoConfigured()) return null;
  try {
    const col = await getCollection("quotations");
    if (!col) return null;
    return await col.findOne({ _id: quotationId, userId, deleted: { $ne: true } });
  } catch (err) {
    console.error("[Failover Read Error] findMongoQuotationForUser:", err.message);
    return null;
  }
}

async function readMongoDatabase() {
  if (!isMongoConfigured()) return { users: [], customers: [], invoices: [], quotations: [] };
  try {
    const [usersCol, customersCol, invoicesCol, quotationsCol] = await Promise.all([
      getCollection("users"),
      getCollection("customers"),
      getCollection("invoices"),
      getCollection("quotations")
    ]);

    const [users, customers, invoices, quotations] = await Promise.all([
      usersCol ? usersCol.find({ deleted: { $ne: true } }).toArray() : [],
      customersCol ? customersCol.find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).toArray() : [],
      invoicesCol ? invoicesCol.find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).toArray() : [],
      quotationsCol ? quotationsCol.find({ deleted: { $ne: true } }).sort({ createdAt: -1 }).toArray() : []
    ]);

    return { users, customers, invoices, quotations };
  } catch (err) {
    console.error("[Failover Read Error] readMongoDatabase:", err.message);
    return { users: [], customers: [], invoices: [], quotations: [] };
  }
}

// -------------------------------------------------------------
// Reverse Sync Helper: Write a record back to Supabase
// -------------------------------------------------------------
export async function writeRecordToSupabase(entityType, entityId, operation, payload) {
  if (!usePostgres) {
    const db = await readDatabase();
    const collectionKey = entityType === "user" ? "users" : `${entityType}s`;
    if (operation === "DELETE") {
      db[collectionKey] = (db[collectionKey] || []).filter((item) => item.id !== entityId);
    } else {
      const idx = (db[collectionKey] || []).findIndex((item) => item.id === entityId);
      if (idx >= 0) {
        db[collectionKey][idx] = payload;
      } else {
        db[collectionKey].unshift(payload);
      }
    }
    await writeDatabase(db);
    return;
  }

  await ensurePostgresDatabase();
  const poolClient = await getPool();
  const tableName = entityType === "user" ? "users" : `${entityType}s`;

  if (operation === "DELETE") {
    await poolClient.query(`DELETE FROM ${tableName} WHERE id = $1`, [entityId]);
    return;
  }

  if (entityType === "customer") {
    await poolClient.query(
      `INSERT INTO customers (id, user_id, data) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [entityId, payload.userId, payload]
    );
  } else if (entityType === "invoice") {
    await poolClient.query(
      `INSERT INTO invoices (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, customer_id = EXCLUDED.customer_id`,
      [entityId, payload.userId, payload.customerId || null, payload]
    );
  } else if (entityType === "quotation") {
    await poolClient.query(
      `INSERT INTO quotations (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, customer_id = EXCLUDED.customer_id`,
      [entityId, payload.userId, payload.customerId || null, payload]
    );
  } else if (entityType === "user") {
    await poolClient.query(
      `INSERT INTO users (id, data) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
      [entityId, payload]
    );
  }
}

// -------------------------------------------------------------
// Core API & CRUD Exports
// -------------------------------------------------------------
export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function readDatabase() {
  try {
    if (usePostgres) {
      return await readPostgresDatabase();
    }

    ensureDatabaseFile();
    const raw = await fs.readFile(databasePath, "utf8");
    return normalizeDatabase(JSON.parse(raw));
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn("[Failover Read] readDatabase falling back to MongoDB Atlas:", primaryErr.message);
      const mongoData = await readMongoDatabase();
      return normalizeDatabase(mongoData);
    }
    throw primaryErr;
  }
}

export async function writeDatabase(nextDatabase) {
  const normalizedDatabase = normalizeDatabase(nextDatabase);

  if (usePostgres) {
    return writePostgresDatabase(normalizedDatabase);
  }

  await fs.writeFile(databasePath, JSON.stringify(normalizedDatabase, null, 2), "utf8");
  return normalizedDatabase;
}

function normalizeDatabase(database) {
  return {
    users: Array.isArray(database?.users) ? database.users : [],
    customers: Array.isArray(database?.customers) ? database.customers : [],
    invoices: Array.isArray(database?.invoices) ? database.invoices : [],
    quotations: Array.isArray(database?.quotations) ? database.quotations : []
  };
}

export async function findUserByEmail(email) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT data FROM users WHERE lower(data->>'email') = lower($1) LIMIT 1",
        [String(email)]
      );

      return rows[0]?.data || null;
    }

    const database = await readDatabase();
    return (
      database.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) ||
      null
    );
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] findUserByEmail for ${email} falling back to MongoDB:`, primaryErr.message);
      return await findMongoUserByEmail(email);
    }
    throw primaryErr;
  }
}

export async function findUserById(userId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query("SELECT data FROM users WHERE id = $1", [
        userId
      ]);

      return rows[0]?.data || null;
    }

    const database = await readDatabase();
    return database.users.find((user) => user.id === userId) || null;
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] findUserById for ${userId} falling back to MongoDB:`, primaryErr.message);
      return await findMongoUserById(userId);
    }
    throw primaryErr;
  }
}

export async function createUser(payload) {
  const user = createUserRecord(payload);

  const savedUser = await dualWrite({
    entityType: "user",
    entityId: user.id,
    operation: "INSERT",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        const existingUser = await findUserByEmail(payload.email);

        if (existingUser) {
          throw new Error("An account with this email already exists.");
        }

        await (await getPool()).query("INSERT INTO users (id, data) VALUES ($1, $2)", [
          user.id,
          user
        ]);

        return sanitizeUser(user);
      }

      const database = await readDatabase();
      const existingUser = database.users.find(
        (entry) => entry.email.toLowerCase() === payload.email.toLowerCase()
      );

      if (existingUser) {
        throw new Error("An account with this email already exists.");
      }

      database.users.push(user);
      await writeDatabase(database);

      return sanitizeUser(user);
    },
    getPayload: () => user
  });

  return sanitizeUser(savedUser);
}

export async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return sanitizeUser(user);
}

export async function savePasswordResetToken(userId, tokenHash, expiresAt) {
  const user = await findUserById(userId);

  if (!user) {
    return null;
  }

  user.passwordResetTokenHash = tokenHash;
  user.passwordResetExpiresAt = expiresAt;
  user.passwordResetRequestedAt = now();

  if (usePostgres) {
    await ensurePostgresDatabase();
    await (await getPool()).query("UPDATE users SET data = $2 WHERE id = $1", [user.id, user]);
    return sanitizeUser(user);
  }

  const database = await readDatabase();
  const userIndex = database.users.findIndex((entry) => entry.id === userId);

  if (userIndex === -1) {
    return null;
  }

  database.users[userIndex] = user;
  await writeDatabase(database);
  return sanitizeUser(user);
}

export async function resetPasswordWithToken(tokenHash, password) {
  const user = await findUserByResetToken(tokenHash);

  if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt) < new Date()) {
    return null;
  }

  user.passwordHash = hashPassword(password);
  delete user.passwordResetTokenHash;
  delete user.passwordResetExpiresAt;
  delete user.passwordResetRequestedAt;
  user.passwordUpdatedAt = now();

  if (usePostgres) {
    await ensurePostgresDatabase();
    await (await getPool()).query("UPDATE users SET data = $2 WHERE id = $1", [user.id, user]);
    return sanitizeUser(user);
  }

  const database = await readDatabase();
  const userIndex = database.users.findIndex((entry) => entry.id === user.id);

  if (userIndex === -1) {
    return null;
  }

  database.users[userIndex] = user;
  await writeDatabase(database);
  return sanitizeUser(user);
}

async function findUserByResetToken(tokenHash) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    const { rows } = await (await getPool()).query(
      "SELECT data FROM users WHERE data->>'passwordResetTokenHash' = $1 LIMIT 1",
      [tokenHash]
    );

    return rows[0]?.data || null;
  }

  const database = await readDatabase();
  return database.users.find((user) => user.passwordResetTokenHash === tokenHash) || null;
}

export async function updateUser(userId, updates) {
  const existingUser = await findUserById(userId);

  if (!existingUser) {
    return null;
  }

  applyUserUpdates(existingUser, updates);

  return await dualWrite({
    entityType: "user",
    entityId: userId,
    operation: "UPDATE",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        await (await getPool()).query("UPDATE users SET data = $2 WHERE id = $1", [userId, existingUser]);
        return sanitizeUser(existingUser);
      }

      const database = await readDatabase();
      const user = database.users.find((entry) => entry.id === userId);

      if (!user) {
        return null;
      }

      applyUserUpdates(user, updates);
      await writeDatabase(database);
      return sanitizeUser(user);
    },
    getPayload: () => sanitizeUser(existingUser)
  });
}

export function loadDatabaseSnapshot() {
  if (usePostgres) {
    throw new Error("Synchronous database snapshots are unavailable when DATABASE_URL is set.");
  }

  ensureDatabaseFile();
  return JSON.parse(readFileSync(databasePath, "utf8"));
}

function createUserRecord(payload) {
  return {
    id: randomUUID(),
    name: payload.name,
    email: payload.email.toLowerCase(),
    passwordHash: hashPassword(payload.password),
    subscriptionPlan: payload.subscriptionPlan || "Free",
    role: "business_user",
    businessName: payload.businessName,
    gstin: payload.gstin || "",
    address: payload.address || "",
    phone: payload.phone || "",
    logoText: payload.logoText || payload.businessName.slice(0, 2).toUpperCase(),
    accountNumber: payload.accountNumber || "",
    ifscCode: payload.ifscCode || "",
    bankName: payload.bankName || "",
    branch: payload.branch || "",
    signatureImage: payload.signatureImage || "",
    createdAt: now()
  };
}

function applyUserUpdates(user, updates) {
  Object.assign(user, {
    name: updates.name ?? user.name,
    businessName: updates.businessName ?? user.businessName,
    gstin: updates.gstin ?? user.gstin,
    address: updates.address ?? user.address,
    phone: updates.phone ?? user.phone,
    logoText: updates.logoText ?? user.logoText,
    accountNumber: updates.accountNumber ?? user.accountNumber ?? "",
    ifscCode: updates.ifscCode ?? user.ifscCode ?? "",
    bankName: updates.bankName ?? user.bankName ?? "",
    branch: updates.branch ?? user.branch ?? "",
    signatureImage: updates.signatureImage ?? user.signatureImage ?? "",
    subscriptionPlan: updates.subscriptionPlan ?? user.subscriptionPlan
  });
}

export async function listCustomersForUser(userId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT data FROM customers WHERE user_id = $1 ORDER BY data->>'createdAt' DESC",
        [userId]
      );

      return rows.map((row) => row.data);
    }

    const database = await readDatabase();
    return database.customers.filter((customer) => customer.userId === userId);
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] listCustomersForUser for ${userId} falling back to MongoDB:`, primaryErr.message);
      return await listMongoCustomersForUser(userId);
    }
    throw primaryErr;
  }
}

export async function createCustomer(userId, payload) {
  const customer = {
    id: randomUUID(),
    userId,
    customerName: payload.customerName,
    gstNumber: payload.gstNumber || "",
    address: payload.address || "",
    mobile: payload.mobile || "",
    createdAt: now(),
    updatedAt: now()
  };

  return await dualWrite({
    entityType: "customer",
    entityId: customer.id,
    operation: "INSERT",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        await (await getPool()).query(
          "INSERT INTO customers (id, user_id, data) VALUES ($1, $2, $3)",
          [customer.id, userId, customer]
        );

        return customer;
      }

      const database = await readDatabase();
      database.customers.unshift(customer);
      await writeDatabase(database);
      return customer;
    },
    getPayload: () => customer
  });
}

export async function updateCustomer(userId, customerId, payload) {
  return await dualWrite({
    entityType: "customer",
    entityId: customerId,
    operation: "UPDATE",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        const { rows } = await (await getPool()).query(
          "SELECT data FROM customers WHERE id = $1 AND user_id = $2",
          [customerId, userId]
        );
        const customer = rows[0]?.data;

        if (!customer) {
          return null;
        }

        applyCustomerUpdates(customer, payload);
        await (await getPool()).query("UPDATE customers SET data = $3 WHERE id = $1 AND user_id = $2", [
          customerId,
          userId,
          customer
        ]);

        return customer;
      }

      const database = await readDatabase();
      const customer = database.customers.find(
        (entry) => entry.id === customerId && entry.userId === userId
      );

      if (!customer) {
        return null;
      }

      applyCustomerUpdates(customer, payload);
      await writeDatabase(database);
      return customer;
    },
    getPayload: (result) => result
  });
}

function applyCustomerUpdates(customer, payload) {
  Object.assign(customer, {
    customerName: payload.customerName ?? customer.customerName,
    gstNumber: payload.gstNumber ?? customer.gstNumber,
    address: payload.address ?? customer.address,
    mobile: payload.mobile ?? customer.mobile,
    updatedAt: now()
  });
}

export async function deleteCustomer(userId, customerId) {
  return await dualWrite({
    entityType: "customer",
    entityId: customerId,
    operation: "DELETE",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        const { rowCount } = await (await getPool()).query(
          "DELETE FROM customers WHERE id = $1 AND user_id = $2",
          [customerId, userId]
        );

        return rowCount > 0;
      }

      const database = await readDatabase();
      const originalLength = database.customers.length;
      database.customers = database.customers.filter(
        (customer) => !(customer.id === customerId && customer.userId === userId)
      );

      await writeDatabase(database);
      return database.customers.length !== originalLength;
    },
    getPayload: () => ({ id: customerId, userId })
  });
}

export async function customerHasInvoices(userId, customerId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT 1 FROM invoices WHERE user_id = $1 AND customer_id = $2 LIMIT 1",
        [userId, customerId]
      );

      return rows.length > 0;
    }

    const database = await readDatabase();
    return database.invoices.some(
      (invoice) => invoice.userId === userId && invoice.customerId === customerId
    );
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      const invoices = await listMongoInvoicesForUser(userId);
      return invoices.some((inv) => inv.customerId === customerId);
    }
    throw primaryErr;
  }
}

export async function listInvoicesForUser(userId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT data FROM invoices WHERE user_id = $1 ORDER BY data->>'createdAt' DESC",
        [userId]
      );

      return rows.map((row) => row.data);
    }

    const database = await readDatabase();
    return database.invoices.filter((invoice) => invoice.userId === userId);
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] listInvoicesForUser for ${userId} falling back to MongoDB:`, primaryErr.message);
      return await listMongoInvoicesForUser(userId);
    }
    throw primaryErr;
  }
}

export async function findInvoiceForUser(userId, invoiceId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT data FROM invoices WHERE id = $1 AND user_id = $2",
        [invoiceId, userId]
      );

      return rows[0]?.data || null;
    }

    const database = await readDatabase();
    return database.invoices.find((entry) => entry.id === invoiceId && entry.userId === userId) || null;
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] findInvoiceForUser for ${invoiceId} falling back to MongoDB:`, primaryErr.message);
      return await findMongoInvoiceForUser(userId, invoiceId);
    }
    throw primaryErr;
  }
}

export async function createInvoiceRecord(invoice) {
  return await dualWrite({
    entityType: "invoice",
    entityId: invoice.id,
    operation: "INSERT",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        await (await getPool()).query(
          "INSERT INTO invoices (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)",
          [invoice.id, invoice.userId, invoice.customerId || null, invoice]
        );

        return invoice;
      }

      const database = await readDatabase();
      database.invoices.unshift(invoice);
      await writeDatabase(database);
      return invoice;
    },
    getPayload: () => invoice
  });
}

export async function updateInvoiceStatus(userId, invoiceId, paymentStatus) {
  const invoice = await findInvoiceForUser(userId, invoiceId);

  if (!invoice) {
    return null;
  }

  invoice.paymentStatus = paymentStatus || invoice.paymentStatus;
  invoice.updatedAt = now();

  return await dualWrite({
    entityType: "invoice",
    entityId: invoiceId,
    operation: "UPDATE",
    primaryAction: async () => {
      if (usePostgres) {
        await (await getPool()).query("UPDATE invoices SET data = $3 WHERE id = $1 AND user_id = $2", [
          invoiceId,
          userId,
          invoice
        ]);

        return invoice;
      }

      const database = await readDatabase();
      const invoiceIndex = database.invoices.findIndex(
        (entry) => entry.id === invoiceId && entry.userId === userId
      );
      if (invoiceIndex >= 0) {
        database.invoices[invoiceIndex] = invoice;
        await writeDatabase(database);
      }
      return invoice;
    },
    getPayload: () => invoice
  });
}

export async function updateInvoiceRecord(userId, invoiceId, payload) {
  const existingInvoice = await findInvoiceForUser(userId, invoiceId);

  if (!existingInvoice) {
    return null;
  }

  const [customers, existingInvoices] = await Promise.all([
    listCustomersForUser(userId),
    listInvoicesForUser(userId)
  ]);

  const customerId = String(payload.customerId ?? existingInvoice.customerId ?? "").trim();
  const customerName = String(
    payload.customerName ?? existingInvoice.customerDetails?.clientName ?? ""
  ).trim();
  const customer = customerId ? customers.find((entry) => entry.id === customerId) : null;

  if (customerId && !customer) {
    throw new Error("Choose a valid customer first.");
  }

  const invoiceItems = Array.isArray(payload.items) ? payload.items : existingInvoice.items || [];
  const invoiceMath = calculateInvoice(invoiceItems, payload.taxMode ?? existingInvoice.taxMode ?? "intra");
  const advancePayment = Math.max(Number(payload.advancePayment ?? existingInvoice.advancePayment ?? 0), 0);
  const balanceDue = Math.round(Math.max(invoiceMath.totals.grandTotal - advancePayment, 0) * 100) / 100;

  if (!invoiceMath.items.length) {
    throw new Error("Add at least one invoice line item.");
  }

  const manualInvoiceNumber = String(payload.invoiceNumber ?? existingInvoice.invoiceNumber ?? "").trim();
  const duplicateInvoice = existingInvoices.find(
    (invoice) =>
      invoice.id !== invoiceId &&
      String(invoice.invoiceNumber || "").toLowerCase() === manualInvoiceNumber.toLowerCase()
  );

  if (manualInvoiceNumber && duplicateInvoice) {
    throw new Error("This invoice number is already in use.");
  }

  const nextInvoice = {
    ...existingInvoice,
    invoiceNumber: manualInvoiceNumber || existingInvoice.invoiceNumber || createInvoiceNumber(existingInvoices),
    invoiceDate: payload.invoiceDate || existingInvoice.invoiceDate,
    dueDate: payload.dueDate || existingInvoice.dueDate,
    projectName: payload.projectName ?? existingInvoice.projectName ?? "",
    billSubject: payload.billSubject ?? existingInvoice.billSubject ?? payload.projectName ?? existingInvoice.projectName ?? "Work",
    taxMode: payload.taxMode || existingInvoice.taxMode || "intra",
    customerId: customer?.id || existingInvoice.customerId || "",
    customerDetails: {
      clientName: customer?.customerName || customerName || existingInvoice.customerDetails?.clientName || "",
      gstNumber: customer?.gstNumber || existingInvoice.customerDetails?.gstNumber || "",
      address: customer?.address || existingInvoice.customerDetails?.address || "",
      mobile: customer?.mobile || existingInvoice.customerDetails?.mobile || ""
    },
    items: invoiceMath.items,
    totals: invoiceMath.totals,
    advancePayment,
    balanceDue,
    paymentStatus: payload.paymentStatus || existingInvoice.paymentStatus || "Pending",
    notes: payload.notes ?? existingInvoice.notes ?? "",
    terms: payload.terms ?? existingInvoice.terms ?? "",
    updatedAt: now()
  };

  return await dualWrite({
    entityType: "invoice",
    entityId: invoiceId,
    operation: "UPDATE",
    primaryAction: async () => {
      if (usePostgres) {
        await (await getPool()).query("UPDATE invoices SET data = $3 WHERE id = $1 AND user_id = $2", [
          invoiceId,
          userId,
          nextInvoice
        ]);

        return nextInvoice;
      }

      const database = await readDatabase();
      const invoiceIndex = database.invoices.findIndex(
        (entry) => entry.id === invoiceId && entry.userId === userId
      );
      if (invoiceIndex >= 0) {
        database.invoices[invoiceIndex] = nextInvoice;
        await writeDatabase(database);
      }
      return nextInvoice;
    },
    getPayload: () => nextInvoice
  });
}

export async function deleteInvoice(userId, invoiceId) {
  return await dualWrite({
    entityType: "invoice",
    entityId: invoiceId,
    operation: "DELETE",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        const { rowCount } = await (await getPool()).query(
          "DELETE FROM invoices WHERE id = $1 AND user_id = $2",
          [invoiceId, userId]
        );

        return rowCount > 0;
      }

      const database = await readDatabase();
      const originalLength = database.invoices.length;
      database.invoices = database.invoices.filter(
        (invoice) => !(invoice.id === invoiceId && invoice.userId === userId)
      );

      await writeDatabase(database);
      return database.invoices.length !== originalLength;
    },
    getPayload: () => ({ id: invoiceId, userId })
  });
}

// -------------------------------------------------------------
// Quotation functions
// -------------------------------------------------------------
export async function listQuotationsForUser(userId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT data FROM quotations WHERE user_id = $1 ORDER BY data->>'createdAt' DESC",
        [userId]
      );

      return rows.map((row) => row.data);
    }

    const database = await readDatabase();
    return database.quotations.filter((quotation) => quotation.userId === userId);
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] listQuotationsForUser for ${userId} falling back to MongoDB:`, primaryErr.message);
      return await listMongoQuotationsForUser(userId);
    }
    throw primaryErr;
  }
}

export async function findQuotationForUser(userId, quotationId) {
  try {
    if (usePostgres) {
      await ensurePostgresDatabase();
      const { rows } = await (await getPool()).query(
        "SELECT data FROM quotations WHERE id = $1 AND user_id = $2",
        [quotationId, userId]
      );

      return rows[0]?.data || null;
    }

    const database = await readDatabase();
    return database.quotations.find((entry) => entry.id === quotationId && entry.userId === userId) || null;
  } catch (primaryErr) {
    if (isMongoConfigured()) {
      console.warn(`[Failover Read] findQuotationForUser for ${quotationId} falling back to MongoDB:`, primaryErr.message);
      return await findMongoQuotationForUser(userId, quotationId);
    }
    throw primaryErr;
  }
}

export async function createQuotationRecord(quotation) {
  return await dualWrite({
    entityType: "quotation",
    entityId: quotation.id,
    operation: "INSERT",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        await (await getPool()).query(
          "INSERT INTO quotations (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)",
          [quotation.id, quotation.userId, quotation.customerId || null, quotation]
        );

        return quotation;
      }

      const database = await readDatabase();
      database.quotations.unshift(quotation);
      await writeDatabase(database);
      return quotation;
    },
    getPayload: () => quotation
  });
}

export async function updateQuotationStatus(userId, quotationId, status) {
  const quotation = await findQuotationForUser(userId, quotationId);

  if (!quotation) {
    return null;
  }

  quotation.status = status || quotation.status;
  quotation.updatedAt = now();

  return await dualWrite({
    entityType: "quotation",
    entityId: quotationId,
    operation: "UPDATE",
    primaryAction: async () => {
      if (usePostgres) {
        await (await getPool()).query("UPDATE quotations SET data = $3 WHERE id = $1 AND user_id = $2", [
          quotationId,
          userId,
          quotation
        ]);

        return quotation;
      }

      const database = await readDatabase();
      const quotationIndex = database.quotations.findIndex(
        (entry) => entry.id === quotationId && entry.userId === userId
      );
      if (quotationIndex >= 0) {
        database.quotations[quotationIndex] = quotation;
        await writeDatabase(database);
      }
      return quotation;
    },
    getPayload: () => quotation
  });
}

export async function updateQuotationRecord(userId, quotationId, payload) {
  const existingQuotation = await findQuotationForUser(userId, quotationId);

  if (!existingQuotation) {
    return null;
  }

  const [customers, existingQuotations] = await Promise.all([
    listCustomersForUser(userId),
    listQuotationsForUser(userId)
  ]);

  const customerId = String(payload.customerId ?? existingQuotation.customerId ?? "").trim();
  const customerName = String(
    payload.customerName ?? existingQuotation.customerDetails?.clientName ?? ""
  ).trim();
  const customer = customerId ? customers.find((entry) => entry.id === customerId) : null;

  if (customerId && !customer) {
    throw new Error("Choose a valid customer first.");
  }

  const sourceItems = Array.isArray(payload.items)
    ? payload.items
    : existingQuotation.items || [];
  const quotationMath = calculateInvoice(sourceItems, payload.taxMode ?? existingQuotation.taxMode ?? "intra", {
    includeAmountOnlyItems: true,
    useDirectAmount: true
  });
  const quotationItems = quotationMath.items.map((item) => ({
    ...item,
    rate: item.rate,
    amount: item.amount
  }));

  if (!quotationMath.items.length) {
    throw new Error("Add at least one quotation line item.");
  }

  const manualQuotationNumber = String(payload.quotationNumber ?? existingQuotation.quotationNumber ?? "").trim();
  const duplicateQuotation = existingQuotations.find(
    (quotation) =>
      quotation.id !== quotationId &&
      String(quotation.quotationNumber || "").toLowerCase() === manualQuotationNumber.toLowerCase()
  );

  if (manualQuotationNumber && duplicateQuotation) {
    throw new Error("This quotation number is already in use.");
  }

  const nextQuotation = {
    ...existingQuotation,
    quotationNumber: manualQuotationNumber || existingQuotation.quotationNumber || createInvoiceNumber(existingQuotations),
    quotationDate: payload.quotationDate || existingQuotation.quotationDate,
    validityDate: payload.validityDate || existingQuotation.validityDate,
    projectName: payload.projectName ?? existingQuotation.projectName ?? "",
    description: payload.description ?? existingQuotation.description ?? "",
    taxMode: payload.taxMode || existingQuotation.taxMode || "intra",
    customerId: customer?.id || existingQuotation.customerId || "",
    customerDetails: {
      clientName: customer?.customerName || customerName || existingQuotation.customerDetails?.clientName || "",
      gstNumber: customer?.gstNumber || existingQuotation.customerDetails?.gstNumber || "",
      address: customer?.address || existingQuotation.customerDetails?.address || "",
      mobile: customer?.mobile || existingQuotation.customerDetails?.mobile || ""
    },
    items: quotationItems,
    totals: quotationMath.totals,
    status: payload.status || existingQuotation.status || "Draft",
    validityPeriod: payload.validityPeriod || existingQuotation.validityPeriod || "30 days",
    notes: payload.notes ?? existingQuotation.notes ?? "",
    terms: payload.terms ?? existingQuotation.terms ?? "",
    updatedAt: now()
  };

  return await dualWrite({
    entityType: "quotation",
    entityId: quotationId,
    operation: "UPDATE",
    primaryAction: async () => {
      if (usePostgres) {
        await (await getPool()).query("UPDATE quotations SET data = $3 WHERE id = $1 AND user_id = $2", [
          quotationId,
          userId,
          nextQuotation
        ]);

        return nextQuotation;
      }

      const database = await readDatabase();
      const quotationIndex = database.quotations.findIndex(
        (entry) => entry.id === quotationId && entry.userId === userId
      );
      if (quotationIndex >= 0) {
        database.quotations[quotationIndex] = nextQuotation;
        await writeDatabase(database);
      }
      return nextQuotation;
    },
    getPayload: () => nextQuotation
  });
}

export async function deleteQuotation(userId, quotationId) {
  return await dualWrite({
    entityType: "quotation",
    entityId: quotationId,
    operation: "DELETE",
    primaryAction: async () => {
      if (usePostgres) {
        await ensurePostgresDatabase();
        const { rowCount } = await (await getPool()).query(
          "DELETE FROM quotations WHERE id = $1 AND user_id = $2",
          [quotationId, userId]
        );

        return rowCount > 0;
      }

      const database = await readDatabase();
      const originalLength = database.quotations.length;
      database.quotations = database.quotations.filter(
        (quotation) => !(quotation.id === quotationId && quotation.userId === userId)
      );

      await writeDatabase(database);
      return database.quotations.length !== originalLength;
    },
    getPayload: () => ({ id: quotationId, userId })
  });
}
