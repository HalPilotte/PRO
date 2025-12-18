import { Pool } from "pg";

/**
 * PostgreSQL access layer (server-side only).
 *
 * - Uses `pg` Pool with `DATABASE_URL` from `.env.local`
 * - Caches the Pool in development to avoid creating a new pool on each hot reload
 * - Provides a single insert helper used by the `/api/players` route
 */
export type PlayerRecord = {
  firstName: string;
  lastName: string;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  state?: string | null;
  // ZIP is stored as text (keeps leading zeros + supports ZIP+4 like "12345-6789").
  zip?: string | null;
  email: string;
  phone?: string | null;
  // Public URL path to an uploaded photo (e.g. "/uploads/<file>.png").
  picturePath?: string | null;
};

const createPool = () => {
  // Expected format: postgres://user:pass@host:5432/dbname
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Provide it via .env.local or the environment."
    );
  }

  return new Pool({
    connectionString,
    // Many hosted Postgres providers require SSL; local Docker usually does not.
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });
};

const globalForPool = globalThis as typeof globalThis & {
  pgPool?: Pool;
};

// In development, Next.js can reload modules frequently; keep a single Pool instance.
const pool = globalForPool.pgPool ?? createPool();
if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

export const insertPlayer = async (player: PlayerRecord) => {
  // Trim strings and normalize email before inserting.
  const trimmed = {
    firstName: player.firstName.trim(),
    lastName: player.lastName.trim(),
    address_1: player.address_1?.trim() || null,
    address_2: player.address_2?.trim() || null,
    city: player.city?.trim() || null,
    state: player.state?.trim() || null,
    zip: player.zip?.trim() || null,
    email: player.email.trim().toLowerCase(),
    phone: player.phone?.trim() || null,
    picturePath: player.picturePath ?? null,
  };

  // Parameterized query prevents SQL injection and handles proper type encoding.
  const { rows } = await pool.query<{ playerId: number }>(
    `INSERT INTO players (
       first_name,
       last_name,
       address_1,
       address_2,
       city,
       state,
       zip,
       email,
       phone,
       picture_path
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING player_id AS "playerId";`,
    [
      trimmed.firstName,
      trimmed.lastName,
      trimmed.address_1,
      trimmed.address_2,
      trimmed.city,
      trimmed.state,
      trimmed.zip,
      trimmed.email,
      trimmed.phone,
      trimmed.picturePath,
    ]
  );

  if (!rows[0]) {
    throw new Error("Player insert did not return an id.");
  }

  return rows[0].playerId;
};
