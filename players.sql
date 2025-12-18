-- Player roster table for PostgreSQL.
--
-- Notes:
-- - `player_id` is an auto-incrementing primary key (BIGSERIAL).
-- - `zip` is VARCHAR to preserve leading zeros and ZIP+4 formatting.
-- - `picture_path` stores a *path* (e.g. `/uploads/<file>.png`), not the image bytes.
--   The file itself is written under `public/uploads` by `app/api/players/route.ts`.
CREATE TABLE IF NOT EXISTS players (
  player_id    BIGSERIAL PRIMARY KEY,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  address_1    VARCHAR(255),
  address_2   VARCHAR(255),
  city        VARCHAR(255),
  state       VARCHAR(255),
  zip         VARCHAR(10),
  email        VARCHAR(255) UNIQUE NOT NULL,
  phone        VARCHAR(32),
  picture_path VARCHAR(255)
);
