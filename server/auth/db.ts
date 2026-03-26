import { Pool } from 'pg';

let pool: Pool | null = null;

const getPool = (): Pool => {
  if (pool) return pool;

  const required = (name: string) => {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
  };

  pool = new Pool({
    user: required('PG_USER'),
    host: required('PG_HOST'),
    database: required('PG_DATABASE'),
    password: required('PG_PASSWORD'),
    port: Number(process.env.PG_PORT || 5432),
  });

  return pool;
};

export type DbUser = {
  id: number;
  email: string;
  password_hash: string | null;
};

export const ensureAuthSchema = async (): Promise<void> => {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

export const getUserByEmail = async (email: string): Promise<DbUser | null> => {
  const pool = getPool();
  const result = await pool.query<DbUser>(
    `SELECT id, email, password_hash FROM users WHERE email = $1 LIMIT 1`,
    [email],
  );
  return result.rows[0] ?? null;
};

export const getUserById = async (id: number): Promise<DbUser | null> => {
  const pool = getPool();
  const result = await pool.query<DbUser>(
    `SELECT id, email, password_hash FROM users WHERE id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
};

export const createUserLocal = async (args: {
  email: string;
  passwordHash: string;
}): Promise<DbUser> => {
  const pool = getPool();
  const result = await pool.query<DbUser>(
    `INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, password_hash`,
    [args.email, args.passwordHash],
  );
  return result.rows[0];
};

export const createUserGoogle = async (args: { email: string }): Promise<DbUser> => {
  const pool = getPool();
  const result = await pool.query<DbUser>(
    `INSERT INTO users (email, password_hash) VALUES ($1, NULL) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id, email, password_hash`,
    [args.email],
  );
  return result.rows[0];
};

