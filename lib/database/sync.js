import { randomUUID } from "node:crypto";
import { getCollection, isMongoConfigured } from "./mongodb.js";

const MAX_RETRIES = 5;
const QUEUE_COLLECTION = "sync_queue";

// In-memory fallback queue if MongoDB is completely offline during queueing
const inMemoryQueue = [];

function now() {
  return new Date().toISOString();
}

/**
 * Normalizes entity data to ensure exact ID alignment:
 * MongoDB document _id will match Supabase record.id exactly.
 */
export function formatMongoDocument(entityType, payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  const id = payload.id || payload._id || randomUUID();
  const document = {
    ...payload,
    _id: id,
    id: id,
    updatedAt: payload.updatedAt || now(),
    createdAt: payload.createdAt || now()
  };

  return document;
}

/**
 * Enqueues a sync operation for background processing or retry.
 */
export async function enqueueSyncOperation({
  entityType,
  entityId,
  operation,
  target = "mongodb",
  payload,
  error
}) {
  const queueItem = {
    _id: randomUUID(),
    entityType,
    entityId,
    operation,
    target,
    payload,
    status: "pending",
    retryCount: 0,
    lastError: error ? String(error?.message || error) : null,
    createdAt: now(),
    updatedAt: now(),
    nextRetryAt: new Date(Date.now() + 1000).toISOString()
  };

  try {
    const queueCol = await getCollection(QUEUE_COLLECTION);
    if (queueCol) {
      await queueCol.insertOne(queueItem);
      return queueItem;
    }
  } catch (err) {
    console.error("[Sync Queue] Failed to write to MongoDB queue collection:", err.message);
  }

  // Fallback to in-memory queue
  inMemoryQueue.push(queueItem);
  return queueItem;
}

/**
 * Synchronizes a record to MongoDB.
 * Implements conflict detection via updatedAt timestamps.
 * Implements soft-delete for DELETE operations.
 */
export async function syncRecordToMongo(entityType, entityId, operation, payload) {
  if (!isMongoConfigured()) {
    return { skipped: true, reason: "MONGODB_URI not configured" };
  }

  const collectionName = entityType === "user" ? "users" : `${entityType}s`;
  const collection = await getCollection(collectionName);

  if (!collection) {
    throw new Error(`MongoDB collection '${collectionName}' is not accessible`);
  }

  if (operation === "DELETE") {
    // Soft-delete to prevent resurrection during sync
    await collection.updateOne(
      { _id: entityId },
      {
        $set: {
          deleted: true,
          deletedAt: now(),
          updatedAt: now()
        }
      },
      { upsert: false }
    );

    return { success: true, operation: "DELETE", entityId };
  }

  // Handle INSERT or UPDATE with conflict resolution
  const existing = await collection.findOne({ _id: entityId });
  const incoming = formatMongoDocument(entityType, payload);

  if (existing && existing.updatedAt && incoming.updatedAt) {
    const existingTime = new Date(existing.updatedAt).getTime();
    const incomingTime = new Date(incoming.updatedAt).getTime();

    if (existingTime > incomingTime) {
      console.warn(
        `[Sync Conflict] Skipped sync for ${entityType}:${entityId}. Existing version (${existing.updatedAt}) is newer than incoming (${incoming.updatedAt}).`
      );
      return { skipped: true, reason: "existing_is_newer", entityId };
    }
  }

  // Ensure deleted flag is cleared if record is being re-created or updated
  incoming.deleted = false;

  await collection.replaceOne({ _id: entityId }, incoming, { upsert: true });

  return { success: true, operation, entityId };
}

/**
 * Synchronizes a record from MongoDB back to Supabase/Postgres.
 * Used when recovering from a failover where writes occurred in MongoDB.
 */
export async function syncRecordToSupabase(entityType, entityId, operation, payload, supabaseWriter) {
  if (typeof supabaseWriter !== "function") {
    throw new Error("supabaseWriter function is required to sync to Supabase");
  }

  return await supabaseWriter(entityType, entityId, operation, payload);
}

/**
 * Dispatches a dual-write operation:
 * Executes the primary operation, then attempts secondary sync to MongoDB.
 * If MongoDB fails, it queues the operation rather than failing the user's request.
 */
export async function dualWrite({
  entityType,
  entityId,
  operation,
  primaryAction,
  getPayload
}) {
  // 1. Execute Primary Action (Supabase / local DB)
  let result;
  let primaryFailed = false;
  let primaryError = null;

  try {
    result = await primaryAction();
  } catch (err) {
    primaryFailed = true;
    primaryError = err;
  }

  // 2. If Primary succeeded: sync to MongoDB secondary
  if (!primaryFailed) {
    const payload = getPayload ? getPayload(result) : result;
    try {
      await syncRecordToMongo(entityType, entityId, operation, payload);
    } catch (syncErr) {
      console.warn(
        `[Sync Warning] Failed to sync ${entityType} ${entityId} to MongoDB: ${syncErr.message}. Queuing retry.`
      );
      await enqueueSyncOperation({
        entityType,
        entityId,
        operation,
        target: "mongodb",
        payload,
        error: syncErr
      });
    }
    return result;
  }

  // 3. If Primary failed: attempt Failover Write to MongoDB
  console.warn(
    `[Failover] Primary database write failed for ${entityType} ${entityId}: ${primaryError.message}. Attempting MongoDB failover write.`
  );

  if (!isMongoConfigured()) {
    throw primaryError;
  }

  try {
    const fallbackPayload = getPayload ? getPayload(null) : null;
    if (!fallbackPayload) {
      throw primaryError;
    }

    // Mark as pending Supabase synchronization
    fallbackPayload.syncStatus = "pending_supabase_sync";
    fallbackPayload.updatedAt = fallbackPayload.updatedAt || now();

    await syncRecordToMongo(entityType, entityId, operation, fallbackPayload);

    // Queue for reverse sync once Supabase is restored
    await enqueueSyncOperation({
      entityType,
      entityId,
      operation,
      target: "supabase",
      payload: fallbackPayload,
      error: primaryError
    });

    return fallbackPayload;
  } catch (mongoErr) {
    console.error("[Failover Failure] Both primary and secondary writes failed:", mongoErr.message);
    throw primaryError;
  }
}

/**
 * Processes queued synchronization operations with exponential backoff.
 */
export async function processSyncQueue(limit = 25, supabaseWriter = null) {
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0
  };

  const queueCol = await getCollection(QUEUE_COLLECTION).catch(() => null);

  // 1. Process in-memory queue first if any
  while (inMemoryQueue.length > 0 && stats.processed < limit) {
    const item = inMemoryQueue.shift();
    stats.processed++;
    try {
      if (item.target === "mongodb") {
        await syncRecordToMongo(item.entityType, item.entityId, item.operation, item.payload);
        stats.succeeded++;
      } else if (item.target === "supabase" && supabaseWriter) {
        await syncRecordToSupabase(item.entityType, item.entityId, item.operation, item.payload, supabaseWriter);
        stats.succeeded++;
      } else {
        inMemoryQueue.push(item);
        stats.skipped++;
        break;
      }
    } catch (err) {
      item.retryCount = (item.retryCount || 0) + 1;
      item.lastError = err.message;
      if (item.retryCount < MAX_RETRIES) {
        inMemoryQueue.push(item);
      }
      stats.failed++;
    }
  }

  // 2. Process MongoDB persistent queue
  if (!queueCol) {
    return stats;
  }

  const pendingItems = await queueCol
    .find({
      status: { $in: ["pending", "failed"] },
      retryCount: { $lt: MAX_RETRIES },
      $or: [
        { nextRetryAt: { $exists: false } },
        { nextRetryAt: { $lte: now() } }
      ]
    })
    .sort({ createdAt: 1 })
    .limit(limit)
    .toArray();

  for (const item of pendingItems) {
    stats.processed++;
    const retryCount = (item.retryCount || 0) + 1;
    const backoffMs = Math.min(Math.pow(2, retryCount) * 1000, 60000);
    const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

    try {
      if (item.target === "mongodb") {
        await syncRecordToMongo(item.entityType, item.entityId, item.operation, item.payload);
      } else if (item.target === "supabase") {
        if (!supabaseWriter) {
          stats.skipped++;
          continue;
        }
        await syncRecordToSupabase(item.entityType, item.entityId, item.operation, item.payload, supabaseWriter);
      }

      await queueCol.updateOne(
        { _id: item._id },
        {
          $set: {
            status: "synced",
            processedAt: now(),
            updatedAt: now()
          }
        }
      );
      stats.succeeded++;
    } catch (err) {
      const isMaxExceeded = retryCount >= MAX_RETRIES;
      await queueCol.updateOne(
        { _id: item._id },
        {
          $set: {
            status: isMaxExceeded ? "permanently_failed" : "failed",
            retryCount,
            lastError: err.message || String(err),
            nextRetryAt,
            updatedAt: now()
          }
        }
      );
      stats.failed++;
    }
  }

  return stats;
}

/**
 * Returns queue counts for health monitoring.
 */
export async function getSyncQueueStats() {
  const stats = {
    pending: inMemoryQueue.length,
    failed: 0,
    total: inMemoryQueue.length
  };

  try {
    const queueCol = await getCollection(QUEUE_COLLECTION);
    if (queueCol) {
      const [pendingCount, failedCount, totalCount] = await Promise.all([
        queueCol.countDocuments({ status: "pending" }),
        queueCol.countDocuments({ status: { $in: ["failed", "permanently_failed"] } }),
        queueCol.countDocuments({})
      ]);

      stats.pending += pendingCount;
      stats.failed += failedCount;
      stats.total += totalCount;
    }
  } catch {
    // Ignore queue query errors during health check
  }

  return stats;
}
