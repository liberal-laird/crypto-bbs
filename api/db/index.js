import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

// Supabase client for public operations
export const supabase = createClient(
  process.env.SUPABASE_URL || 'https://krtnkpvqxxfemgqluslr.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtydG5rcHZxeHhmZW1ncWx1c2xyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNDk3MTYsImV4cCI6MjA4NTkyNTcxNn0.Dxv7BeWGHl-dPacXUBafxIEooUvPoVfwnW_N2pT0FU8'
);

// PostgreSQL pool for direct queries
export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

// Helper to run queries
export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text: text.substring(0, 50), duration, rows: result.rowCount });
  return result;
}

// Get a client for transactions
export async function getClient() {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Override release to log
  const releaseOnce = release;
  client.release = () => {
    releaseOnce();
  };
  
  return client;
}

export default { supabase, pool, query, getClient };
