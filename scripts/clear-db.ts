/**
 * Clear database script - removes all data from collections
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

const COLLECTIONS_TO_CLEAR = [
  'users',
  'accounts',
  'sessions',
  'contacts',
  'dictionaries',
  'dictionaryitems',
  'opportunities',
  'pipelines',
  'pipelinestages',
  'channels',
  'interactions',
  'projects',
  'tasks',
];

async function clearDatabase(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database instance');
  }

  const existingCollections = await db.listCollections().toArray();
  const existingNames = existingCollections.map(c => c.name);

  let deleted = 0;
  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    if (existingNames.includes(collectionName)) {
      const result = await db.collection(collectionName).deleteMany({});
      deleted += result.deletedCount;
      console.log(`  Cleared ${collectionName}: ${result.deletedCount} documents`);
    }
  }

  console.log(`\nTotal deleted: ${deleted} documents`);
  await mongoose.disconnect();
}

clearDatabase()
  .then(() => {
    console.log('Database cleared successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error clearing database:', error);
    process.exit(1);
  });
