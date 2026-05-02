# Successful Online Deployment Setup

This document records the deployment setup that successfully worked for the online AutoPartIQ MVP.

## Current online architecture

- Frontend: Vercel
- Backend: Render
- Database: Supabase PostgreSQL
- ORM: Prisma
- Repository: `mohanadaltaai-ops/autopartiq`

## Backend deployment

Backend is deployed on Render.

Working backend URL:

- `https://autopartiq.onrender.com`

Health check endpoint:

- `https://autopartiq.onrender.com/health`

Expected response:

```json
{
  "ok": true,
  "app": "AutoPartIQ API"
}
```

Render service settings:

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health endpoint: `/health`

Required Render environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ANTHROPIC_API_KEY` optional

## Database connection used by Render

Render should use the Supabase pooler / Prisma connection string, not the direct database URL.

Format:

```text
postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

Notes:

- Do not include quotes in Render environment variable values.
- Do not include `DATABASE_URL=` in the value field.
- Replace `YOUR_PASSWORD` with the current Supabase database password.
- Use the pooler URL for Render runtime.
- The direct URL `db.PROJECT_REF.supabase.co:5432` did not work reliably in this setup.

## Prisma database setup workaround

Render Shell was not available because it is a paid feature.

Running `prisma db push` through Render build command and the Supabase pooler hung at the Prisma datasource connection line.

The direct database URL returned a reachability error in local testing:

- `P1001: Can't reach database server`

The working workaround was:

1. Generate SQL locally from Prisma schema.
2. Paste/run the generated SQL in Supabase SQL Editor.
3. Seed demo users manually using Supabase SQL Editor.
4. Keep Render runtime connected through the Supabase pooler URL.

Command used locally from the backend folder:

```bash
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > supabase_schema.sql
```

Then open the generated file:

```bash
notepad supabase_schema.sql
```

Copy all SQL and run it in:

- Supabase Project → SQL Editor → New query

Run without RLS for this MVP because security is handled by the Express backend and Prisma, not direct frontend access to Supabase.

## Manual SQL seed used

After tables were created, demo data was seeded using Supabase SQL Editor.

```sql
INSERT INTO "User" ("id", "name", "phone", "role", "createdAt")
VALUES
  ('customer-demo-001', 'Demo Customer', '07799999999', 'CUSTOMER', NOW()),
  ('supplier-user-001', 'Al-Sadiq Parts', '07701234567', 'SUPPLIER', NOW()),
  ('admin-demo-001', 'Demo Admin', '07711111111', 'ADMIN', NOW()),
  ('super-admin-demo-001', 'Demo Super Admin', '07700000000', 'SUPER_ADMIN', NOW())
ON CONFLICT ("phone") DO NOTHING;

INSERT INTO "Supplier" ("id", "userId", "name", "phone", "location", "supportedMakesJson", "isActive", "createdAt", "updatedAt")
VALUES
  (
    'supplier-demo-001',
    'supplier-user-001',
    'Al-Sadiq Parts',
    '07701234567',
    'Basra',
    '["Japanese","Korean","Chinese"]',
    true,
    NOW(),
    NOW()
  )
ON CONFLICT ("userId") DO NOTHING;
```

## Frontend deployment

Frontend is deployed on Vercel.

Vercel project settings:

- Framework: Vite
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment: Production

Required Vercel environment variable:

- `VITE_API_URL=https://autopartiq.onrender.com/api`

After updating Vercel environment variables, redeploy the Production deployment.

## Backend CORS configuration

Render backend must allow the Vercel frontend URL through `FRONTEND_URL`.

Render environment variable:

```text
FRONTEND_URL=https://YOUR-VERCEL-FRONTEND-URL
```

The backend code also allows `.vercel.app` origins and localhost for development.

## Demo login users

Use any four-digit OTP.

- Customer: `07799999999`
- Supplier: `07701234567`
- Admin: `07711111111`
- Super Admin: `07700000000`

## Verified online workflow

The following flow was tested successfully online:

1. Customer login.
2. Customer creates a part request.
3. Supplier login.
4. Supplier sees matching lead.
5. Supplier sends offer.
6. Customer sees offer.
7. Customer opens checkout preview and confirms order.
8. Admin login.
9. Admin views suppliers, orders, audit logs, payment controls, and delivery controls.

## Important operational notes

- Do not run `node prisma/seed.js` on every Render deploy, because it can reset or duplicate demo assumptions depending on future seed changes.
- Keep Render build command as `npm install && npm run build` after schema setup is complete.
- If Prisma schema changes later, regenerate SQL locally and apply it through Supabase SQL Editor again, unless a better migration method is added.
- The app is online-testable but still not fully production-ready.

## Future improvement

Add a proper migration/deployment workflow later:

- GitHub Actions CI/CD, if workflow upload is possible manually.
- Render paid shell or deploy hooks.
- Prisma migrations executed from a trusted machine.
- Supabase migration workflow.
