# AutoPartIQ — Production-Ready MVP

AutoPartIQ is a 3-sided car spare parts marketplace for Iraq: Customers request parts, Suppliers submit offers, and Admins manage suppliers/orders/revenue.

This repository is a production-oriented MVP port of the Claude demo design into a real React + Backend + Database app.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma
- Database: SQLite for local MVP testing; PostgreSQL planned for production
- Auth: JWT role-based auth with demo OTP flow
- AI: Claude API is called only from the backend

## Margin Model

- Supplier price < 100,000 IQD: 10%
- Supplier price 100,000–200,000 IQD: 13%
- Supplier price > 200,000 IQD: 14%
- Customer price is rounded to nearest 250 IQD
- Platform revenue = customer price - supplier price

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create local environment files using the instructions in:

```text
docs/ENVIRONMENT.md
```

3. Prepare the database:

```bash
npm run db:push
npm run seed
```

4. Start frontend and backend:

```bash
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000

## Demo Logins

Use any OTP code during demo login.

- Customer: 07799999999
- Supplier: 07701234567
- Admin: 07711111111
- Super Admin: 07700000000

## Current MVP Scope

- Customer login and part request creation
- AI part identification backend route with safe demo fallback
- Supplier matching leads by supported car origin
- Supplier offer submission
- Customer offer acceptance
- Order creation and tracking
- Admin dashboard, supplier list, and order overview
- Tiered margin pricing engine

## Production Roadmap

- Real SMS OTP provider
- PostgreSQL production migration
- Payment integration
- Image upload storage via S3/Supabase Storage
- Push notifications
- Supplier verification workflow
- Admin audit logs
- Stronger validation and automated tests
- Arabic RTL refinements
