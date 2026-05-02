# Vercel + Render + Supabase/Neon Deployment Checklist

Use this checklist when moving AutoPartIQ to online testing without local Docker.

## 1. Database

Choose one hosted PostgreSQL provider:

- Supabase PostgreSQL
- Neon PostgreSQL

Create a new database project and copy the PostgreSQL connection string.

Required backend variable:

- `DATABASE_URL`

Do not commit the database URL to GitHub.

## 2. Backend on Render

Create a new Render Web Service from the GitHub repository.

Recommended settings:

- Root directory: `backend`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Health check path: `/health`

Required backend environment variables:

- `DATABASE_URL`
- `JWT_SECRET`
- `FRONTEND_URL`
- `ANTHROPIC_API_KEY` optional
- `NODE_ENV=production`

After deployment, test:

- `/health`

Expected result:

- `ok: true`

## 3. Database setup

After the backend has access to the hosted database, run Prisma database push against the hosted database.

Manual options:

- Use Render shell if available
- Use local terminal later when Docker issue is solved
- Add GitHub Actions manually later if workflow upload remains blocked

Required command concept:

- `prisma db push`

## 4. Frontend on Vercel

Create a new Vercel project from the GitHub repository.

Recommended settings:

- Root directory: `frontend`
- Framework: Vite
- Build command: `npm run build`
- Output directory: `dist`

Required frontend environment variable:

- `VITE_API_URL`

Value format:

- `https://your-render-backend-url/api`

## 5. Update backend CORS

Set backend `FRONTEND_URL` to the final Vercel frontend URL.

Example format:

- `https://your-vercel-project.vercel.app`

## 6. Online smoke test

Use these demo users:

- Customer: `07799999999`
- Supplier: `07701234567`
- Admin: `07711111111`
- Super Admin: `07700000000`

Test sequence:

1. Customer creates a part request.
2. Supplier sends an offer.
3. Customer opens checkout and confirms order.
4. Customer sees payment and delivery info.
5. Supplier sees the order and delivery info.
6. Admin updates payment status.
7. Admin assigns delivery information.
8. Admin changes order status.
9. Admin checks audit logs.

## 7. Current manual follow-up items

- Real file upload storage connection
- Real SMS OTP provider
- Real payment provider
- GitHub Actions CI workflow if platform allows or manual upload is used
- Full Arabic translation coverage
- Production QA and security review
