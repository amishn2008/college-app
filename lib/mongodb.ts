import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memServer: MongoMemoryServer | null = null;

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  uri?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function startMemoryServer() {
  if (!memServer) {
    memServer = await MongoMemoryServer.create();
  }
  const uri = memServer.getUri();
  return uri;
}

async function connectWithUri(uri: string) {
  const opts = {
    bufferCommands: false,
  };

  return mongoose.connect(uri, opts).then((mongooseInstance) => mongooseInstance);
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uriToUse = MONGODB_URI;

    if (!uriToUse) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGODB_URI must be defined in production');
      }
      cached.promise = startMemoryServer().then((memoryUri) => {
        cached.uri = memoryUri;
        return connectWithUri(memoryUri);
      });
    } else {
      cached.uri = uriToUse;
      cached.promise = connectWithUri(uriToUse).catch(async (error) => {
        if (process.env.NODE_ENV === 'production') {
          throw error;
        }
        console.warn(
          '[database] Could not connect to provided MONGODB_URI. Falling back to in-memory MongoDB.',
          error
        );
        const memoryUri = await startMemoryServer();
        cached.uri = memoryUri;
        return connectWithUri(memoryUri);
      });
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;

