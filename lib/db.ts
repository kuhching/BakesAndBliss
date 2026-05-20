import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function createPool(): Pool {
  const url = process.env.POSTGRES_URL;
  if (!url) throw new Error('POSTGRES_URL env var is not set');
  return new Pool({ connectionString: url });
}

// Reuse pool across hot-reloads in dev
const pool = globalThis._pgPool ?? createPool();
if (process.env.NODE_ENV !== 'production') globalThis._pgPool = pool;

export default pool;
