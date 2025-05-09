import pkg from 'postgres';
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateTransactionsTable() {
  try {
    // Create a client connection
    const client = await pool.connect();
    
    try {
      // Start transaction
      await client.query('BEGIN');
      
      // Check if columns already exist to avoid errors
      const columnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'transactions' AND table_schema = 'public'
      `;
      
      const columnsResult = await client.query(columnsQuery);
      const existingColumns = columnsResult.rows.map(row => row.column_name);
      
      // Add missing columns if they don't exist
      if (!existingColumns.includes('nonce')) {
        console.log('Adding nonce column to transactions table...');
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN nonce BIGINT DEFAULT 0 NOT NULL
        `);
      }
      
      if (!existingColumns.includes('signature')) {
        console.log('Adding signature column to transactions table...');
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN signature TEXT DEFAULT '' NOT NULL
        `);
      }
      
      if (!existingColumns.includes('status')) {
        console.log('Adding status column to transactions table...');
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN status VARCHAR(20) DEFAULT 'pending' NOT NULL
        `);
      }
      
      if (!existingColumns.includes('fee')) {
        console.log('Adding fee column to transactions table...');
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN fee NUMERIC(18,6) NULL
        `);
      }
      
      if (!existingColumns.includes('metadata')) {
        console.log('Adding metadata column to transactions table...');
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN metadata JSONB NULL
        `);
      }
      
      if (!existingColumns.includes('created_at')) {
        console.log('Adding created_at column to transactions table...');
        await client.query(`
          ALTER TABLE transactions 
          ADD COLUMN created_at TIMESTAMP DEFAULT NOW() NOT NULL
        `);
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      console.log('Transactions table updated successfully!');
    } catch (err) {
      // Rollback transaction on error
      await client.query('ROLLBACK');
      console.error('Error updating transactions table:', err);
      throw err;
    } finally {
      // Release client
      client.release();
    }
  } catch (err) {
    console.error('Error connecting to database:', err);
    throw err;
  } finally {
    // Close pool
    await pool.end();
  }
}

// Run the function
updateTransactionsTable().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});