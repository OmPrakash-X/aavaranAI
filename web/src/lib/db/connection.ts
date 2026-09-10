// ============================================================
// MongoDB Connection — Singleton pattern for Next.js
// Handles hot-reload in development without leaking connections
// ============================================================

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aavaran';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use global cache to persist across hot reloads in development
declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB with connection pooling and retry logic.
 * Returns cached connection if already established.
 */
export async function connectDB(): Promise<typeof mongoose> {
  // Return cached connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // If no promise exists, create a new connection
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
    };

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((mongooseInstance) => {
        console.log('[DB] Connected to MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@'));
        return mongooseInstance;
      })
      .catch((err) => {
        cached.promise = null; // Reset so next call retries
        console.error('[DB] MongoDB connection failed:', err.message);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/**
 * Disconnect from MongoDB (useful for cleanup in tests)
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
    console.log('[DB] Disconnected from MongoDB');
  }
}

/**
 * Check if MongoDB is connected
 */
export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
