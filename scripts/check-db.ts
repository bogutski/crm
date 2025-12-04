/**
 * Check database script - lists collections and document counts
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

async function checkDatabase(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database instance');
  }

  const collections = await db.listCollections().toArray();

  console.log('\n=== Collections in Database ===\n');

  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    console.log(`  ${collection.name}: ${count} documents`);
  }

  await mongoose.disconnect();
}

checkDatabase()
  .then(() => {
    console.log('\nCheck completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError checking database:', error);
    process.exit(1);
  });
