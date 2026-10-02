# Enterprise Operations Platform

A NestJS + TypeORM backend for the enterprise operations platform.

## Project layout

- `backend/` — NestJS application (replaces the legacy Express backend, kept in `backend-legacy/`).
- `backend/src/<domain>/` — Domain modules that mirror the DBML schemas:
  - `organization/`, `iam/`, `catalog/`, `vendor/`, `procurement/`, `audit/`.
- `backend/src/database/migrations/` — TypeORM migrations.
- `backend/enterprise-operation-v1.dbml` — Source-of-truth schema blueprint.
- `backend-legacy/` — Previous Express + `pg` implementation (kept for reference).

## Tech stack

- NestJS 12 (ESM)
- TypeORM 0.3.x
- PostgreSQL (multi-schema)
- `pg` driver
- Vitest for tests

## Getting started

1. Ensure PostgreSQL is running and a database/user exist (e.g. `enterprise_operations` / `enterprise_app`).
2. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
4. Run migrations:
   ```bash
   npm run migration:run
   ```
5. Start the app:
   ```bash
   npm run start:dev
   ```
6. Verify health:
   - `GET http://localhost:3000/health`
   - `GET http://localhost:3000/health/database`

## Generating new migrations

After changing entities:

```bash
cd backend
npm run migration:generate -- src/database/migrations/DescriptionOfChange
```

## Notes

- Entity relations are intentionally unidirectional to avoid ESM circular-import issues.
- Multi-schema PostgreSQL support is configured: each DBML namespace maps to a Postgres schema.
