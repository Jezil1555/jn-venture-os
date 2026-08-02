import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// A single shared connection pool for the whole API process.
// DATABASE_URL takes precedence if set (handy for hosted Postgres);
// otherwise falls back to the discrete PGHOST/PGUSER/etc vars.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'jn_venture_os',
    });

pool.on('error', (err) => {
  // A background/idle client error should not crash the whole API.
  console.error('Unexpected error on idle Postgres client', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
