/**
 * Database reset script - completely clears all collections
 *
 * Usage:
 *   npm run db:reset
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local');
  process.exit(1);
}

// Collections to clear
const COLLECTIONS = [
  'users',
  'accounts',
  'sessions',
  'contacts',
  'dictionaries',
  'dictionaryitems',
  'opportunities',
];

async function main() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected!\n');

  const db = mongoose.connection.db;
  if (!db) {
    console.error('Failed to get database instance');
    process.exit(1);
  }

  // Get all existing collections
  const existingCollections = await db.listCollections().toArray();
  const existingNames = existingCollections.map(c => c.name);

  let deleted = 0;

  for (const collectionName of COLLECTIONS) {
    if (existingNames.includes(collectionName)) {
      const result = await db.collection(collectionName).deleteMany({});
      console.log(`Cleared ${collectionName}: ${result.deletedCount} documents`);
      deleted += result.deletedCount;
    }
  }

  console.log(`\nDeleted ${deleted} documents total`);

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
