import { Pool } from 'pg';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Check for DATABASE_URL environment variable
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable not set');
    }
    
    // Create client instance
    const client = postgres(process.env.DATABASE_URL, { max: 1 });
    
    // Create drizzle instance with the client
    const db = drizzle(client, { schema });
    
    // Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('Database migrations completed successfully');
    
    // Close connection
    await client.end();
    
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

// Call the function if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export default runMigrations;