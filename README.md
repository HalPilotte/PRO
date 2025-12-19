# PRO Desktop

Native desktop client (Tauri + React/Vite) with a Go API and PostgreSQL backing.

## Structure
- `players-desktop/` — Tauri frontend (React/Vite).
- `go-api/` — Go HTTP API (`POST /api/players`) talking to Postgres.
- `docker-compose.yml` — local Postgres.
- `players.sql` — schema (players table).

## Prereqs
- Node 18+ and npm.
- Rust toolchain (for Tauri).
- Go 1.23+ (or Docker).
- Docker (for Postgres and optional Go run).

## Run Postgres
```bash
docker compose up -d
# DB: postgres://player_admin:player_password@localhost:5432/players
```

## Run Go API
With Go installed:
```bash
cd go-api
go run . \
  -port 8080 \
  # env: DATABASE_URL=postgres://player_admin:player_password@localhost:5432/players
```

Or via Docker (no local Go):
```bash
cd go-api
docker run --rm -p 8080:8080 -v "$PWD":/app -w /app \
  -e DATABASE_URL='postgres://player_admin:player_password@host.docker.internal:5432/players' \
  golang:1.23 go run .
```

## Run Tauri (dev)
```bash
cd players-desktop
VITE_API_BASE=http://localhost:8080 npm run dev:tauri
```

## Build installers
```bash
cd players-desktop
VITE_API_BASE=http://localhost:8080 npm run build:tauri
```

## Notes
- Player registration modal posts multipart/form-data to the Go API; DOB accepts MM-DD/MM/DD and stores ISO in Postgres.
- Adjust `VITE_API_BASE` for LAN/cloud API endpoints.
