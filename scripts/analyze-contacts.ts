/**
 * Analyze contacts script - checks type and source distribution
 */

import mongoose from 'mongoose';
import { config } from 'dotenv';

config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

async function analyzeContacts(): Promise<void> {
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

  // Get total count
  const totalContacts = await contactsCollection.countDocuments();
  console.log(`\nTotal contacts: ${totalContacts}`);

  // Count contacts with both contactType and source
  const withBoth = await contactsCollection.countDocuments({
    contactType: { $exists: true, $ne: null },
    source: { $exists: true, $ne: null },
  });

  // Count contacts with only contactType
  const onlyType = await contactsCollection.countDocuments({
    contactType: { $exists: true, $ne: null },
    $or: [
      { source: { $exists: false } },
      { source: null }
    ]
  });

  // Count contacts with only source
  const onlySource = await contactsCollection.countDocuments({
    source: { $exists: true, $ne: null },
    $or: [
      { contactType: { $exists: false } },
      { contactType: null }
    ]
  });

  // Count contacts with neither contactType nor source
  const withNeither = await contactsCollection.countDocuments({
    $or: [
      { contactType: { $exists: false }, source: { $exists: false } },
      { contactType: null, source: null },
      { contactType: null, source: { $exists: false } },
      { contactType: { $exists: false }, source: null }
    ]
  });

  console.log('\n=== Distribution Analysis ===');
  console.log(`\nWith both type AND source: ${withBoth} (${((withBoth / totalContacts) * 100).toFixed(2)}%)`);
  console.log(`With only type: ${onlyType} (${((onlyType / totalContacts) * 100).toFixed(2)}%)`);
  console.log(`With only source: ${onlySource} (${((onlySource / totalContacts) * 100).toFixed(2)}%)`);
  console.log(`With neither: ${withNeither} (${((withNeither / totalContacts) * 100).toFixed(2)}%)`);

  // Verify total
  const verifyTotal = withBoth + onlyType + onlySource + withNeither;
  console.log(`\nVerification: ${verifyTotal} === ${totalContacts} ${verifyTotal === totalContacts ? '✓' : '✗'}`);

  // Sample some contacts
  console.log('\n=== Sample Contacts ===');

  console.log('\n1. Contacts with both type and source (sample 3):');
  const sampleBoth = await contactsCollection.find({
    contactType: { $exists: true, $ne: null },
    source: { $exists: true, $ne: null },
  }).limit(3).toArray();
  sampleBoth.forEach(c => console.log(`   - ${c.name}: contactType="${c.contactType}", source="${c.source}"`));

  console.log('\n2. Contacts with only type (sample 3):');
  const sampleOnlyType = await contactsCollection.find({
    contactType: { $exists: true, $ne: null },
    $or: [
      { source: { $exists: false } },
      { source: null }
    ]
  }).limit(3).toArray();
  sampleOnlyType.forEach(c => console.log(`   - ${c.name}: contactType="${c.contactType}", source=null`));

  console.log('\n3. Contacts with only source (sample 3):');
  const sampleOnlySource = await contactsCollection.find({
    source: { $exists: true, $ne: null },
    $or: [
      { contactType: { $exists: false } },
      { contactType: null }
    ]
  }).limit(3).toArray();
  sampleOnlySource.forEach(c => console.log(`   - ${c.name}: contactType=null, source="${c.source}"`));

  console.log('\n4. Contacts with neither (sample 3):');
  const sampleNeither = await contactsCollection.find({
    $or: [
      { contactType: { $exists: false }, source: { $exists: false } },
      { contactType: null, source: null },
      { contactType: null, source: { $exists: false } },
      { contactType: { $exists: false }, source: null }
    ]
  }).limit(3).toArray();
  sampleNeither.forEach(c => console.log(`   - ${c.name}: contactType=null, source=null`));

  await mongoose.disconnect();
}

analyzeContacts()
  .then(() => {
    console.log('\nAnalysis completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nError analyzing contacts:', error);
    process.exit(1);
  });
