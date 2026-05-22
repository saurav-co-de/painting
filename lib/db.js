import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const dataDirectory = path.join(process.cwd(), "data");
const databasePath = path.join(dataDirectory, "buildbill-db.json");
const usePostgres = Boolean(process.env.DATABASE_URL);

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
        dueDate: "2026-05-24",
        projectName: "Commercial repainting - Phase 1",
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
            description: "Exterior primer and putty",
            unit: "Sqft",
            quantity: 1800,
            rate: 26,
            gstPercentage: 18,
            amount: 46800,
            gstAmount: 8424,
            cgst: 0,
            sgst: 0,
            igst: 8424
          },
          {
            description: "Texture paint application",
            unit: "Sqft",
            quantity: 1800,
            rate: 42,
            gstPercentage: 18,
            amount: 75600,
            gstAmount: 13608,
            cgst: 0,
            sgst: 0,
            igst: 13608
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
    ]
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
      await client.query("CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers (user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices (user_id)");

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
  const [usersResult, customersResult, invoicesResult] = await Promise.all([
    databasePool.query("SELECT data FROM users"),
    databasePool.query("SELECT data FROM customers ORDER BY data->>'createdAt' DESC"),
    databasePool.query("SELECT data FROM invoices ORDER BY data->>'createdAt' DESC")
  ]);

  return {
    users: usersResult.rows.map((row) => row.data),
    customers: customersResult.rows.map((row) => row.data),
    invoices: invoicesResult.rows.map((row) => row.data)
  };
}

async function writePostgresDatabase(nextDatabase, existingClient) {
  const client = existingClient || (await (await getPool()).connect());
  const ownsClient = !existingClient;

  try {
    if (ownsClient) {
      await client.query("BEGIN");
    }

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

export function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

export async function readDatabase() {
  if (usePostgres) {
    return readPostgresDatabase();
  }

  ensureDatabaseFile();
  const raw = await fs.readFile(databasePath, "utf8");
  return JSON.parse(raw);
}

export async function writeDatabase(nextDatabase) {
  if (usePostgres) {
    return writePostgresDatabase(nextDatabase);
  }

  await fs.writeFile(databasePath, JSON.stringify(nextDatabase, null, 2), "utf8");
  return nextDatabase;
}

export async function findUserByEmail(email) {
  const database = await readDatabase();
  return (
    database.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) ||
    null
  );
}

export async function findUserById(userId) {
  const database = await readDatabase();
  return database.users.find((user) => user.id === userId) || null;
}

export async function createUser(payload) {
  const database = await readDatabase();
  const existingUser = database.users.find(
    (user) => user.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
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

  database.users.push(user);
  await writeDatabase(database);

  return sanitizeUser(user);
}

export async function authenticateUser(email, password) {
  const user = await findUserByEmail(email);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return null;
  }

  return sanitizeUser(user);
}

export async function updateUser(userId, updates) {
  const database = await readDatabase();
  const user = database.users.find((entry) => entry.id === userId);

  if (!user) {
    return null;
  }

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

  await writeDatabase(database);
  return sanitizeUser(user);
}

export function loadDatabaseSnapshot() {
  if (usePostgres) {
    throw new Error("Synchronous database snapshots are unavailable when DATABASE_URL is set.");
  }

  ensureDatabaseFile();
  return JSON.parse(readFileSync(databasePath, "utf8"));
}
