import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export async function pingDB() {
  const { rows } = await pool.query('select 1 as ok');
  return rows[0].ok === 1;
}
