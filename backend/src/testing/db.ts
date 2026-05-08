import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let memoryServer: MongoMemoryServer | null = null;
let setupPromise: Promise<void> | null = null;

/**
 * Lazily start a shared in-memory MongoDB for integration tests and
 * connect the global mongoose instance to it. Subsequent calls reuse
 * the already-running instance, so each test file can call this in its
 * `before()` hook without paying the startup cost more than once.
 */
export async function setupTestDb(): Promise<void> {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (setupPromise) {
    await setupPromise;
    return;
  }
  setupPromise = (async () => {
    memoryServer = await MongoMemoryServer.create();
    process.env.MONGO_URL = memoryServer.getUri();
    await mongoose.connect(memoryServer.getUri());
  })();
  await setupPromise;
}

/**
 * Drop every collection in the active mongoose connection. Use this in
 * `beforeEach()` hooks to keep tests independent without restarting
 * the in-memory MongoDB instance.
 */
export async function clearTestDb(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany({});
    })
  );
}

/**
 * Disconnect mongoose and stop the in-memory MongoDB instance. Tests
 * generally do not need to call this directly because the test runner
 * is invoked with `--test-force-exit`; `mongodb-memory-server` registers
 * its own process-exit hooks to kill the child mongod.
 */
export async function teardownTestDb(): Promise<void> {
  try {
    await mongoose.disconnect();
  } catch {
    /* noop */
  }
  if (memoryServer) {
    try {
      await memoryServer.stop();
    } catch {
      /* noop */
    }
    memoryServer = null;
  }
  setupPromise = null;
}
