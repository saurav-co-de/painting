import dns from "node:dns";
import { MongoClient } from "mongodb";

try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch {}

function getMongoUri() {
  return (
    process.env.MONGODB_URI?.trim() ||
    process.env.MONGODB_URL?.trim() ||
    process.env.MONGO_URI?.trim() ||
    process.env.MONGO_URL?.trim() ||
    ""
  );
}

function getDbName() {
  return process.env.MONGODB_DB_NAME?.trim() || "buildbill";
}

let cachedClient = null;
let cachedDb = null;
let clientPromise = null;
let cachedUri = null;

export function isMongoConfigured() {
  return Boolean(getMongoUri());
}

export async function normalizeMongoUri(rawUri) {
  if (!rawUri || !rawUri.startsWith("mongodb+srv://")) {
    return rawUri;
  }

  try {
    const match = rawUri.match(/^mongodb\+srv:\/\/([^@]+)@([^/?]+)(\/[^?]*)?(\?.*)?$/);
    if (!match) return rawUri;
    const [, auth, host, pathName = "", queryString = ""] = match;

    const dnsPromises = await import("node:dns/promises");
    const resolver = new dnsPromises.Resolver();
    resolver.setServers(["8.8.8.8", "1.1.1.1"]);

    const records = await resolver.resolveSrv(`_mongodb._tcp.${host}`);
    if (records && records.length > 0) {
      const hosts = records.map((r) => `${r.name}:${r.port}`).join(",");
      const delimiter = queryString.includes("?") ? "&" : "?";
      return `mongodb://${auth}@${hosts}${pathName}${queryString}${delimiter}ssl=true&authSource=admin`;
    }
  } catch (err) {
    console.warn("[MongoDB DNS] SRV resolution fallback error:", err.message);
  }

  return rawUri;
}

export async function getMongoClient() {
  const uri = getMongoUri();
  if (!uri) {
    return null;
  }

  if (cachedClient && cachedUri === uri) {
    return cachedClient;
  }

  if (cachedUri !== uri) {
    cachedClient = null;
    cachedDb = null;
    clientPromise = null;
    cachedUri = uri;
  }

  if (!clientPromise) {
    clientPromise = (async () => {
      const resolvedUri = await normalizeMongoUri(uri);
      const client = new MongoClient(resolvedUri, {
        maxPoolSize: 10,
        minPoolSize: 1,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        socketTimeoutMS: 10000
      });

      const connectedClient = await client.connect();
      cachedClient = connectedClient;
      cachedDb = connectedClient.db(getDbName());
      return connectedClient;
    })().catch((error) => {
      clientPromise = null;
      console.error("[MongoDB] Connection failure:", error.message);
      throw error;
    });
  }

  return clientPromise;
}

export async function getMongoDb() {
  if (!isMongoConfigured()) {
    return null;
  }

  if (cachedDb) {
    return cachedDb;
  }

  await getMongoClient();
  return cachedDb;
}

export async function getCollection(collectionName) {
  const db = await getMongoDb();
  if (!db) {
    return null;
  }
  return db.collection(collectionName);
}

export async function checkMongoHealth() {
  if (!isMongoConfigured()) {
    return {
      status: "NOT_CONFIGURED",
      message: "MONGODB_URI environment variable is not defined"
    };
  }

  const startTime = Date.now();
  try {
    const db = await getMongoDb();
    if (!db) {
      return { status: "OFFLINE", error: "Could not initialize database instance" };
    }

    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    return {
      status: "ONLINE",
      latencyMs
    };
  } catch (error) {
    return {
      status: "OFFLINE",
      error: error.message || "Failed to reach MongoDB Atlas"
    };
  }
}

export async function closeMongoConnection() {
  if (cachedClient) {
    try {
      await cachedClient.close();
    } finally {
      cachedClient = null;
      cachedDb = null;
      clientPromise = null;
    }
  }
}
