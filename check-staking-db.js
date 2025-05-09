// Simple script to test if staking transactions are being saved to the database
import pg from 'pg';
const { Pool } = pg;

async function checkStakingTransactions() {
  console.log('Checking database for staking-related transactions...');
  
  // Create a new pool using the DATABASE_URL environment variable
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // Query for all staking-related transactions
    const result = await pool.query(`
      SELECT * FROM transactions 
      WHERE type IN ('STAKE_START', 'STAKE_END', 'STAKING_REWARD') 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    
    const transactions = result.rows;
    
    console.log(`Found ${transactions.length} staking-related transactions:`);
    
    // Print each transaction
    transactions.forEach((tx, index) => {
      console.log(`\nTransaction #${index + 1}:`);
      console.log(`  Hash: ${tx.hash}`);
      console.log(`  Type: ${tx.type}`);
      console.log(`  From: ${tx.from_address}`);
      console.log(`  To: ${tx.to_address}`);
      console.log(`  Amount: ${tx.amount}`);
      console.log(`  Timestamp: ${new Date(Number(tx.timestamp)).toISOString()}`);
      console.log(`  Status: ${tx.status}`);
      console.log(`  Metadata: ${tx.metadata ? JSON.stringify(tx.metadata, null, 2) : 'None'}`);
    });
    
  } catch (error) {
    console.error('Error querying transactions:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the function
checkStakingTransactions();