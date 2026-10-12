import mongoose from 'mongoose';

let cachedPromise = null;

export const connectDB = async () => {
  // 1. If already connected, reuse the active connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // 2. Resolve MongoDB URI
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoURI) {
    if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
      const err = new Error(
        'MONGODB_URI environment variable is missing on Vercel! ' +
        'Please go to Vercel Dashboard > Storage > MongoDB Atlas and click "Connect to Project", ' +
        'or add MONGODB_URI in Project Settings > Environment Variables.'
      );
      console.error('[MongoDB Config Error]:', err.message);
      throw err;
    }
    // Local development fallback
    const localURI = 'mongodb://127.0.0.1:27017/fieldvisitcrm';
    return mongoose.connect(localURI);
  }

  // 3. Connect with optimal serverless timeout settings
  if (!cachedPromise || mongoose.connection.readyState === 0) {
    console.log(`[MongoDB] Connecting to database...`);
    cachedPromise = mongoose.connect(mongoURI, {
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
