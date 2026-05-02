# Online Testing and Deployment Plan

This plan avoids local Docker testing and uses hosted services instead.

## Recommended online test stack

- Database: Supabase PostgreSQL or Neon PostgreSQL
- Backend: Render, Railway, or Fly.io
- Frontend: Vercel or Netlify
- Image storage later: Supabase Storage, Cloudinary, or AWS S3

## Phase 1: Hosted database

Create a hosted PostgreSQL database using Supabase or Neon.

Save the production database connection string as a backend environment variable named `DATABASE_URL`.

Do not commit the database URL to GitHub.

## Phase 2: Backend deployment

Deploy the `backend` workspace to Render or Railway.

Required backend environment variables:

- `PORT`
- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ANTHROPIC_API_KEY` optional for live AI

Backend health check path:

- `/health`

Expected health response:

- `ok: true`
- `app: AutoPartIQ API`

## Phase 3: Frontend deployment

Deploy the `frontend` workspace to Vercel or Netlify.

Required frontend environment variable:

- `VITE_API_URL`

The value should point to the deployed backend API URL ending with `/api`.

## Phase 4: Database preparation

After backend deployment, run Prisma database setup against the hosted PostgreSQL database.

This can be done through the hosting platform shell, a one-time deploy command, or a GitHub Actions workflow later.

Manual follow-up: CI workflow upload was previously blocked, so deployment automation may need to be added manually later.

## Phase 5: Online smoke test

Use these demo users:

- Customer: 07799999999
- Supplier: 07701234567
- Admin: 07711111111
- Super Admin: 07700000000

Use any four-digit OTP during MVP testing.

Test sequence:

1. Customer creates a Japanese Toyota request.
2. Supplier sends an offer.
3. Customer opens checkout preview and confirms order.
4. Supplier sees order and marks it completed.
5. Admin checks revenue, order status, supplier list, and supplier edit/disable controls.

## Current online testing notes

- Payment is a placeholder and defaults to cash-on-delivery MVP flow.
- Delivery workflow is a placeholder and not connected to drivers yet.
- Photo upload is currently URL-based. File upload storage should be connected later.
- OTP is demo-only and should be replaced with a real SMS provider before production launch.
