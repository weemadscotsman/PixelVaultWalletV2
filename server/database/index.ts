import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './schema';

// Check for DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL environment variable not set. Using in-memory storage as fallback.');
}

// Create client instance
const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/pvx';
const client = postgres(connectionString, { max: 10 });

// Create drizzle instance with the client
export const db = drizzle(client, { schema });

/**
 * Initialize database with required tables and migrations
 */
export async function initDatabase(): Promise<void> {
  try {
    // Create tables if they don't exist (development only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Running database migrations...');
      // This approach is for development only - production should use proper migrations
      await migrate(db, { migrationsFolder: './drizzle' });
      console.log('Database migrations completed successfully');
    }
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw new Error('Failed to initialize database');
  }
}

/**
 * Check if database is accessible
 * @returns True if database is accessible, false otherwise
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // Simple query to check if database is accessible
    const result = await client`SELECT 1 as connected`;
    return result[0]?.connected === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * Close database connection
 */
export async function closeDatabase(): Promise<void> {
  try {
    await client.end();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Export client for direct use when needed
export { client };