/**
 * MongoDB Local to Atlas Online Migration Script
 * 
 * Usage:
 *   node backend/scripts/migrateToAtlas.js "mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fieldvisitcrm?retryWrites=true&w=majority"
 * 
 * Or set environment variable:
 *   set ATLAS_MONGO_URI="mongodb+srv://..." (Windows)
 *   node backend/scripts/migrateToAtlas.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const SOURCE_URI = process.env.LOCAL_MONGO_URI || 'mongodb://127.0.0.1:27017/fieldvisitcrm';
const TARGET_URI = process.argv[2] || process.env.MONGODB_URI || process.env.ATLAS_MONGO_URI || process.env.TARGET_MONGO_URI || process.env.MONGO_URI;

if (!TARGET_URI || TARGET_URI.includes('127.0.0.1') || TARGET_URI.includes('localhost')) {
  console.log(`
========================================================================
❌ ERROR: Target MongoDB Atlas connection string is required!
========================================================================

Please run the script providing your MongoDB Atlas connection string:
  node backend/scripts/migrateToAtlas.js "mongodb+srv://<username>:<password>@cluster.mongodb.net/fieldvisitcrm?retryWrites=true&w=majority"

Or set ATLAS_MONGO_URI in your environment or backend/.env file:
  ATLAS_MONGO_URI="mongodb+srv://..."
========================================================================
`);
  process.exit(1);
}

const runMigration = async () => {
  console.log(`\n========================================================================`);
  console.log(`🚀 STARTING MONGODB DATABASE MIGRATION TO ATLAS ONLINE`);
  console.log(`========================================================================`);
  console.log(`📍 Source (Local):  ${SOURCE_URI}`);
  console.log(`☁️  Target (Atlas):  ${TARGET_URI.replace(/:([^@]+)@/, ':****@')}`);
  console.log(`========================================================================\n`);

  let sourceConn = null;
  let targetConn = null;

  try {
    // 1. Connect to Local MongoDB
    console.log(`⏳ Connecting to local MongoDB...`);
    sourceConn = await mongoose.createConnection(SOURCE_URI, {
      serverSelectionTimeoutMS: 5000
    }).asPromise();
    console.log(`✅ Connected to local MongoDB: ${sourceConn.name}`);

    // 2. Connect to Target MongoDB Atlas
    console.log(`⏳ Connecting to MongoDB Atlas Online...`);
    targetConn = await mongoose.createConnection(TARGET_URI, {
      serverSelectionTimeoutMS: 12000
    }).asPromise();
    console.log(`✅ Connected to MongoDB Atlas: ${targetConn.name}\n`);

    // 3. List all source collections
    const collections = await sourceConn.db.listCollections().toArray();
    const collectionNames = collections
      .map(c => c.name)
      .filter(name => !name.startsWith('system.'));

    if (collectionNames.length === 0) {
      console.log(`⚠️  No collections found in local database "${sourceConn.name}".`);
      process.exit(0);
    }

    console.log(`Found ${collectionNames.length} collection(s) to migrate:`);
    collectionNames.forEach((name, i) => console.log(`  ${i + 1}. ${name}`));
    console.log(`\n------------------------------------------------------------------------`);

    let totalMigratedDocs = 0;

    // 4. Migrate each collection
    for (const colName of collectionNames) {
      process.stdout.write(`Migrating "${colName}"... `);

      const sourceCollection = sourceConn.db.collection(colName);
      const targetCollection = targetConn.db.collection(colName);

      const docs = await sourceCollection.find({}).toArray();

      if (docs.length === 0) {
        console.log(`(0 documents, skipped)`);
        continue;
      }

      // Upsert/replace documents to prevent duplicate key errors if re-run
      const bulkOps = docs.map(doc => ({
        replaceOne: {
          filter: { _id: doc._id },
          replacement: doc,
          upsert: true
        }
      }));

      const result = await targetCollection.bulkWrite(bulkOps, { ordered: false });
      const count = (result.upsertedCount || 0) + (result.modifiedCount || 0) + (result.matchedCount || 0);

      totalMigratedDocs += docs.length;
      console.log(`✅ ${docs.length} documents migrated successfully!`);
    }

    console.log(`\n========================================================================`);
    console.log(`🎉 MIGRATION COMPLETED SUCCESSFULLY!`);
    console.log(`📊 Total Documents Migrated: ${totalMigratedDocs}`);
    console.log(`========================================================================`);
    console.log(`\nNext Steps:`);
    console.log(`1. In Vercel Project Settings > Environment Variables:`);
    console.log(`   Set MONGO_URI = ${TARGET_URI.replace(/:([^@]+)@/, ':****@')}`);
    console.log(`2. Redeploy or trigger deploy on Vercel.\n`);

  } catch (error) {
    console.error(`\n❌ Migration failed:`, error.message);
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.error(`👉 Tip: Check your Atlas database username and password in the connection string.`);
    } else if (error.message.includes('whitelist') || error.message.includes('timed out') || error.message.includes('queryTxt ETIMEOUT')) {
      console.error(`👉 Tip: Ensure "0.0.0.0/0" is added to Network Access IP Whitelist in MongoDB Atlas.`);
    }
    process.exit(1);
  } finally {
    if (sourceConn) await sourceConn.close();
    if (targetConn) await targetConn.close();
  }
};

runMigration();
