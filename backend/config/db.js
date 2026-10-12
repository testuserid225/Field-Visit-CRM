import mongoose from 'mongoose';

let cachedPromise = null;

/**
 * Sanitizes and cleanses MongoDB connection strings from common copy-paste errors:
 * - Wrapping quotes ("..." or '...')
 * - Leading/trailing whitespace or newlines
 * - Prefix accidentally copied in Vercel UI (e.g. MONGODB_URI=...)
 * - 'mongosh' command wrapper copied from MongoDB Atlas Connect modal
 * - Missing scheme (e.g. cluster.mongodb.net => mongodb+srv://cluster.mongodb.net)
 * - Typo like mongodb+srv// (missing colon)
 */
export const sanitizeMongoURI = (rawURI) => {
  if (!rawURI || typeof rawURI !== 'string') return '';

  let uri = rawURI.trim();

  // Strip wrapping single or double quotes
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // Strip key prefix if accidentally pasted in value field: MONGODB_URI=... or MONGO_URI=...
  uri = uri.replace(/^(MONGODB_URI|MONGO_URI)=\s*/i, '').trim();

  // Strip wrapping quotes again
  if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
    uri = uri.slice(1, -1).trim();
  }

  // If user pasted mongosh command from Atlas Connect modal
  if (uri.toLowerCase().startsWith('mongosh')) {
    uri = uri.replace(/^mongosh\s+/i, '').trim();
  }

  // Fix common typo: mongodb+srv// or mongodb// (missing colon)
  uri = uri.replace(/^mongodb\+srv\/\//i, 'mongodb+srv://');
  uri = uri.replace(/^mongodb\/\//i, 'mongodb://');

  // Strip wrapping quotes again
  uri = uri.replace(/^["']+|["']+$/g, '').trim();

  // If there are other flags or surrounding text, extract the mongodb connection string
  const match = uri.match(/(mongodb(?:\+srv)?:\/\/[^\s"']+)/i);
  if (match) {
    uri = match[1].trim();
  }

  // If user entered only hostname without scheme (e.g. cluster0.xxxxx.mongodb.net or user:pass@cluster0...)
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    if (uri.includes('.mongodb.net')) {
      uri = `mongodb+srv://${uri}`;
    }
  }

  return uri;
};

export const connectDB = async () => {
  // 1. If already connected, reuse the active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. Resolve and sanitize MongoDB URI
  const rawURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  const mongoURI = sanitizeMongoURI(rawURI);

  if (!mongoURI || (!mongoURI.startsWith('mongodb://') && !mongoURI.startsWith('mongodb+srv://'))) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const preview = rawURI ? String(rawURI).substring(0, 16) + '...' : 'undefined';
      const err = new Error(
        `Invalid MongoDB URI in environment variables (received "${preview}"). ` +
        `The connection string must start with "mongodb://" or "mongodb+srv://". ` +
        `Please check Vercel Project Settings > Environment Variables > MONGODB_URI.`
      );
      console.error('[MongoDB Config Error]:', err.message);
      throw err;
    }
    // Local development fallback
    const localURI = 'mongodb://127.0.0.1:27017/fieldvisitcrm';
    return mongoose.connect(localURI);
  }

  // 3. Connect with optimal serverless timeout and connection settings
  if (!cachedPromise || mongoose.connection.readyState === 0) {
    console.log(`[MongoDB] Connecting to database...`);
    cachedPromise = mongoose.connect(mongoURI, {
      dbName: 'fieldvisitcrm',
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    }).then((conn) => {
      console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
      return conn;
    }).catch((err) => {
      cachedPromise = null;
      console.error(`[MongoDB Connection Error]: ${err.message}`);
      throw err;
    });
  }

  return cachedPromise;
};
