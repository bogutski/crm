/**
 * Inspect contacts script - shows raw contact data
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

async function inspectContacts(): Promise<void> {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI not found in .env.local');
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to get database instance');
  }

  const contactsCollection = db.collection('contacts');

  // Get 10 random contacts
  const contacts = await contactsCollection.find({}).limit(10).toArray();

  console.log('\n=== Sample Contacts (Raw Data) ===\n');

  contacts.forEach((contact, index) => {
    console.log(`${index + 1}. ${contact.name}:`);
    console.log(`   _id: ${contact._id}`);
    console.log(`   contactType: ${JSON.stringify(contact.contactType)}`);
    console.log(`   source: ${JSON.stringify(contact.source)}`);
    console.log(`   emails: ${contact.emails?.length || 0} emails`);
    console.log(`   phones: ${contact.phones?.length || 0} phones`);
    console.log('');
  });

  await mongoose.disconnect();
}

inspectContacts()
  .then(() => {
    console.log('Inspection completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError inspecting contacts:', error);
    process.exit(1);
  });
