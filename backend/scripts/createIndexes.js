#!/usr/bin/env node

/**
 * Database Index Migration Script
 * P1 Performance Fix: Create optimized indexes for all models
 *
 * Usage:
 *   node scripts/createIndexes.js
 *
 * This script:
 * 1. Connects to MongoDB
 * 2. Syncs indexes for all models (creates new, removes orphaned)
 * 3. Reports index creation status
 * 4. Exits with appropriate status code
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models to register schemas and indexes
const Case = require('../src/models/Case');
const Message = require('../src/models/Message');
const CaseFile = require('../src/models/CaseFile');
const User = require('../src/models/User');
const Panelist = require('../src/models/Panelist');
const CaseSubmission = require('../src/models/CaseSubmission');
const CaseSubmissionData = require('../src/models/CaseSubmissionData');
const CaseActivity = require('../src/models/CaseActivity');
const Meeting = require('../src/models/Meeting');
const CaseResolution = require('../src/models/CaseResolution');

const models = [
  { name: 'Case', model: Case },
  { name: 'Message', model: Message },
  { name: 'CaseFile', model: CaseFile },
  { name: 'User', model: User },
  { name: 'Panelist', model: Panelist },
  { name: 'CaseSubmission', model: CaseSubmission },
  { name: 'CaseSubmissionData', model: CaseSubmissionData },
  { name: 'CaseActivity', model: CaseActivity },
  { name: 'Meeting', model: Meeting },
  { name: 'CaseResolution', model: CaseResolution },
];

/**
 * Connect to MongoDB
 */
async function connectDB() {
  try {
    const options = {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✓ MongoDB Connected:', mongoose.connection.host);
  } catch (error) {
    console.error('✗ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
}

/**
 * Sync indexes for a single model
 */
async function syncModelIndexes(name, model) {
  try {
    console.log(`\nSyncing indexes for ${name}...`);

    // Get existing indexes before sync
    const existingIndexes = await model.collection.getIndexes();
    console.log(`  Current indexes: ${Object.keys(existingIndexes).length}`);

    // Sync indexes (creates new, removes orphaned)
    await model.syncIndexes();

    // Get indexes after sync
    const newIndexes = await model.collection.getIndexes();
    console.log(`  Updated indexes: ${Object.keys(newIndexes).length}`);

    // Display index details
    console.log('  Index details:');
    for (const [indexName, indexDef] of Object.entries(newIndexes)) {
      const keyStr = JSON.stringify(indexDef.key);
      console.log(`    - ${indexName}: ${keyStr}`);
    }

    console.log(`✓ ${name} indexes synced successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Error syncing ${name} indexes:`, error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('DATABASE INDEX MIGRATION SCRIPT');
  console.log('P1 Performance Fix: Creating optimized indexes');
  console.log('='.repeat(60));

  // Connect to database
  await connectDB();

  const results = {
    success: [],
    failed: [],
  };

  // Sync indexes for each model
  for (const { name, model } of models) {
    const success = await syncModelIndexes(name, model);
    if (success) {
      results.success.push(name);
    } else {
      results.failed.push(name);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✓ Successfully synced: ${results.success.length} models`);
  if (results.success.length > 0) {
    console.log(`  ${results.success.join(', ')}`);
  }

  if (results.failed.length > 0) {
    console.log(`\n✗ Failed to sync: ${results.failed.length} models`);
    console.log(`  ${results.failed.join(', ')}`);
  }

  // Close connection
  await mongoose.connection.close();
  console.log('\n✓ MongoDB connection closed');

  // Exit with appropriate code
  const exitCode = results.failed.length > 0 ? 1 : 0;
  console.log(`\nExiting with code ${exitCode}`);
  process.exit(exitCode);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Run migration
main();
