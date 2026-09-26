# Neon PostgreSQL

The backend now runs application SQL on Neon PostgreSQL through the `pg` pool. Existing controller query-builder calls are routed through `config/postgres-client.js`; the browser continues to call the application API and must never receive database credentials.

## Environment

Configure these variables in the backend deployment environment. Keep credentials in the host's secret store, not in source control.

- `DATABASE_URL`: Neon pooled connection string for application traffic.
- `DATABASE_URL_UNPOOLED`: Neon direct connection string for schema migrations.
- `PG_POOL_MAX`: optional per-instance pool limit; defaults to `5`.
- `PG_CONNECTION_TIMEOUT_MS`: optional connection timeout; defaults to `15000`.
- `JWT_SECRET` and `JWT_REFRESH_SECRET`: strong independent secrets for application sessions.
- `SUPABASE_AUTH_URL` and `SUPABASE_AUTH_ANON_KEY`: optional legacy Auth fallback only. Supabase is no longer used for application table queries.

Production startup fails clearly when `DATABASE_URL` is missing. The local backend can load `DATABASE_URL` and `DATABASE_URL_UNPOOLED` from the ignored workspace `.env.local` file.

## Schema

`config/schema.sql` is the canonical idempotent schema for the app's college, student, exam, assignment, session, answer, result, violation, subscription, notification, audit, and randomized-question tables. Run it with:

```powershell
npm run migrate
```

The migration uses the direct URL, executes in a transaction, and only seeds a super-admin when both `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are explicitly configured. It never uses a built-in production password.

## Existing Supabase Data

The Neon production database initially had no application tables or rows; the canonical schema has been applied. Existing rows have not been copied because a Neon URL does not provide access to the Supabase source database. A Supabase direct PostgreSQL connection or a verified data export is required before importing existing colleges, students, exams, submissions, and results. Test that import on a disposable Neon branch, compare row counts and foreign-key integrity, and only then import to production.

Supabase Auth remains available only for legacy college sign-in fallback. This database cutover does not migrate Supabase Auth users or sessions; migrating identity requires a separate account-migration plan and must preserve existing password/login behavior.