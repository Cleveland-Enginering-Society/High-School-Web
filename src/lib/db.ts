import { Pool } from 'pg';

// Create a connection pool
// In Next.js, we need to handle connection pooling properly to avoid
// creating too many connections during serverless function execution
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DB_URI;
    
    if (!connectionString) {
      throw new Error('DB_URI environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Export a function to get a client from the pool
export async function getDbClient() {
  return getPool().connect();
}

// Export a function to execute queries directly
export async function query(text: string, params?: any[]) {
  return getPool().query(text, params);
}

// Export the pool for advanced usage
export function getDbPool(): Pool {
  return getPool();
}

// Gracefully close the pool (useful for cleanup)
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

