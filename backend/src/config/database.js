import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  // Add these options for better connection handling
  max: 10,  // Reduced from 20
  idleTimeoutMillis: 10000,  // Reduced from 30000
  connectionTimeoutMillis: 5000,  // Reduced from 10000
  // Add retry logic
  retry: {
    max: 3,
    timeout: 3000
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection failed:', err);
  } else {
    console.log('Successfully connected to database');
  }
});

export default pool;