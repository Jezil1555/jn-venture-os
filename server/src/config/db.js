import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Hosted Postgres providers (Neon, Render Postgres, Supabase, etc.) require
// SSL and generally don't hand you a CA bundle to verify against, so we
// accept their cert without full verification — set DB_SSL=true in that
// environment's variables. Leave it unset for a plain local/Docker Postgres.
const useSsl = process.env.DB_SSL === 'true';

// A single shared connection pool for the whole API process.
// DATABASE_URL takes precedence if set (handy for hosted Postgres);
// otherwise falls back to the discrete PGHOST/PGUSER/etc vars.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: process.env.PGDATABASE || 'jn_venture_os',
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });

pool.on('error', (err) => {
  // A background/idle client error should not crash the whole API.
  console.error('Unexpected error on idle Postgres client', err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
