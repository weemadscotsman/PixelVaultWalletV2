// Simple script to test if staking transactions are being saved to the database
import { db } from './server/database/index.js';
import { transactions } from './shared/schema.fixed.js';
import { sql } from 'drizzle-orm';

async function checkStakingTransactions() {
  console.log('Checking database for staking-related transactions...');
  
  try {
    // Query for all staking-related transactions
    const stakeTransactions = await db.select()
      .from(transactions)
      .where(sql`${transactions.type} IN ('STAKE_START', 'STAKE_END', 'STAKING_REWARD')`)
      .orderBy(transactions.timestamp, 'desc')
      .limit(10);
    
    console.log(`Found ${stakeTransactions.length} staking-related transactions:`);
    
    // Print each transaction
    stakeTransactions.forEach((tx, index) => {
      console.log(`\nTransaction #${index + 1}:`);
      console.log(`  Hash: ${tx.hash}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  From: ${tx.from}`); // Note: Database column is 'from' not 'fromAddress'
      console.log(`  To: ${tx.to}`);     // Note: Database column is 'to' not 'toAddress'
      console.log(`  Amount: ${tx.amount}`);
      console.log(`  Timestamp: ${new Date(Number(tx.timestamp)).toISOString()}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Metadata: ${tx.metadata ? JSON.stringify(tx.metadata, null, 2) : 'None'}`);
    });
    
  } catch (error) {
    console.error('Error querying transactions:', error);
  } finally {
    // Close the database connection
    await db.end();
  }
}

// Run the function
checkStakingTransactions();