// Simple script to test if any transactions are being saved to the database
import pg from 'pg';
const { Pool } = pg;

async function checkStakingTransactions() {
  console.log('Checking database for transactions...');
  
  // Create a new pool using the DATABASE_URL environment variable
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    // First check if the transactions table exists
    const tableCheck = await pool.query(`
      SELECT to_regclass('public.transactions') as table_exists;
    `);
    
    if (!tableCheck.rows[0].table_exists) {
      console.log('ERROR: transactions table does not exist in the database!');
      return;
    }
    
    console.log('Transactions table exists.');
    
    // Get the schema of the transactions table
    const schemaCheck = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'transactions'
    `);
    
    console.log('\nTable schema:');
    schemaCheck.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });
    
    // Query for all transactions
    const allResult = await pool.query(`
      SELECT COUNT(*) as total FROM transactions
    `);
    
    console.log(`\nTotal transactions in database: ${allResult.rows[0].total}`);
    
    // Query for all transaction types
    const typesResult = await pool.query(`
      SELECT type, COUNT(*) as count 
      FROM transactions 
      GROUP BY type 
      ORDER BY count DESC
    `);
    
    console.log('\nTransaction types:');
    typesResult.rows.forEach(type => {
      console.log(`  ${type.type}: ${type.count}`);
    });
    
    // Query for staking-related transactions
    const stakingResult = await pool.query(`
      SELECT * FROM transactions 
      WHERE type IN ('STAKE_START', 'STAKE_END', 'STAKING_REWARD') 
      ORDER BY timestamp DESC 
      LIMIT 10
    `);
    
    const transactions = stakingResult.rows;
    
    console.log(`\nFound ${transactions.length} staking-related transactions:`);
    
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