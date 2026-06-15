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
    ],
    quotations: [],
    exactbills: []
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
      await client.query(`
        CREATE TABLE IF NOT EXISTS exactbills (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          customer_id TEXT,
          data JSONB NOT NULL
        )
      `);
      await client.query("CREATE INDEX IF NOT EXISTS customers_user_id_idx ON customers (user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices (user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS quotations_user_id_idx ON quotations (user_id)");
      await client.query("CREATE INDEX IF NOT EXISTS exactbills_user_id_idx ON exactbills (user_id)");

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
}

export async function findUserById(userId) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    const { rows } = await (await getPool()).query("SELECT data FROM users WHERE id = $1", [
      userId
    ]);

    return rows[0]?.data || null;
  }

  const database = await readDatabase();
  return database.users.find((user) => user.id === userId) || null;
}

export async function createUser(payload) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    const existingUser = await findUserByEmail(payload.email);

    if (existingUser) {
      throw new Error("An account with this email already exists.");
    }

    const user = createUserRecord(payload);
    await (await getPool()).query("INSERT INTO users (id, data) VALUES ($1, $2)", [
      user.id,
      user
    ]);

    return sanitizeUser(user);
  }

  const database = await readDatabase();
  const existingUser = database.users.find(
    (user) => user.email.toLowerCase() === payload.email.toLowerCase()
  );

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const user = createUserRecord(payload);

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
  if (usePostgres) {
    await ensurePostgresDatabase();
    const user = await findUserById(userId);

    if (!user) {
      return null;
    }

    applyUserUpdates(user, updates);
    await (await getPool()).query("UPDATE users SET data = $2 WHERE id = $1", [user.id, user]);
    return sanitizeUser(user);
  }

  const database = await readDatabase();
  const user = database.users.find((entry) => entry.id === userId);

  if (!user) {
    return null;
  }

  applyUserUpdates(user, updates);

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
}

export async function updateCustomer(userId, customerId, payload) {
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
}

export async function customerHasInvoices(userId, customerId) {
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
}

export async function listInvoicesForUser(userId) {
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
}

export async function findInvoiceForUser(userId, invoiceId) {
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
}

export async function createInvoiceRecord(invoice) {
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
}

export async function updateInvoiceStatus(userId, invoiceId, paymentStatus) {
  const invoice = await findInvoiceForUser(userId, invoiceId);

  if (!invoice) {
    return null;
  }

  invoice.paymentStatus = paymentStatus || invoice.paymentStatus;
  invoice.updatedAt = now();

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
  database.invoices[invoiceIndex] = invoice;
  await writeDatabase(database);
  return invoice;
}

export async function deleteInvoice(userId, invoiceId) {
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
}

// Quotation functions
export async function listQuotationsForUser(userId) {
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
}

export async function findQuotationForUser(userId, quotationId) {
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
}

export async function createQuotationRecord(quotation) {
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
}

export async function updateQuotationStatus(userId, quotationId, status) {
  const quotation = await findQuotationForUser(userId, quotationId);

  if (!quotation) {
    return null;
  }

  quotation.status = status || quotation.status;
  quotation.updatedAt = now();

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
  database.quotations[quotationIndex] = quotation;
  await writeDatabase(database);
  return quotation;
}

export async function deleteQuotation(userId, quotationId) {
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
}

// Exact Bills Functions
export async function listExactBillsForUser(userId) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    const { rows } = await (await getPool()).query(
      "SELECT data FROM exactbills WHERE user_id = $1 ORDER BY data->>'createdAt' DESC",
      [userId]
    );

    return rows.map((row) => row.data);
  }

  const database = await readDatabase();
  return database.exactbills.filter((exactbill) => exactbill.userId === userId);
}

export async function findExactBillForUser(userId, exactbillId) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    const { rows } = await (await getPool()).query(
      "SELECT data FROM exactbills WHERE id = $1 AND user_id = $2",
      [exactbillId, userId]
    );

    return rows[0]?.data || null;
  }

  const database = await readDatabase();
  return database.exactbills.find((entry) => entry.id === exactbillId && entry.userId === userId) || null;
}

export async function createExactBillRecord(exactbill) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    await (await getPool()).query(
      "INSERT INTO exactbills (id, user_id, customer_id, data) VALUES ($1, $2, $3, $4)",
      [exactbill.id, exactbill.userId, exactbill.customerId || null, exactbill]
    );

    return exactbill;
  }

  const database = await readDatabase();
  database.exactbills.unshift(exactbill);
  await writeDatabase(database);
  return exactbill;
}

export async function updateExactBillStatus(userId, exactbillId, status) {
  const exactbill = await findExactBillForUser(userId, exactbillId);

  if (!exactbill) {
    return null;
  }

  exactbill.status = status || exactbill.status;
  exactbill.updatedAt = now();

  if (usePostgres) {
    await (await getPool()).query("UPDATE exactbills SET data = $3 WHERE id = $1 AND user_id = $2", [
      exactbillId,
      userId,
      exactbill
    ]);

    return exactbill;
  }

  const database = await readDatabase();
  const exactbillIndex = database.exactbills.findIndex(
    (entry) => entry.id === exactbillId && entry.userId === userId
  );
  database.exactbills[exactbillIndex] = exactbill;
  await writeDatabase(database);
  return exactbill;
}

export async function deleteExactBill(userId, exactbillId) {
  if (usePostgres) {
    await ensurePostgresDatabase();
    const { rowCount } = await (await getPool()).query(
      "DELETE FROM exactbills WHERE id = $1 AND user_id = $2",
      [exactbillId, userId]
    );

    return rowCount > 0;
  }

  const database = await readDatabase();
  const originalLength = database.exactbills.length;
  database.exactbills = database.exactbills.filter(
    (exactbill) => !(exactbill.id === exactbillId && exactbill.userId === userId)
  );

  await writeDatabase(database);
  return database.exactbills.length !== originalLength;
}
