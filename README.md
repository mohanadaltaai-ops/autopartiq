# AutoPartIQ — Production-Ready MVP

AutoPartIQ is a 3-sided car spare parts marketplace for Iraq: Customers request parts, Suppliers submit offers, and Admins manage suppliers/orders/revenue.

This repository is a production-oriented MVP port of the Claude demo design into a real React + Backend + Database app.

## Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express + Prisma
- Database: PostgreSQL in production; SQLite fallback for quick local testing
- Auth: JWT role-based auth with demo OTP flow
- AI: Claude API is called only from the backend
- CI: GitHub Actions build workflow

## Margin Model

- Supplier price < 100,000 IQD: 10%
- Supplier price 100,000–200,000 IQD: 13%
- Supplier price > 200,000 IQD: 14%
- Customer price is rounded to nearest 250 IQD
- Platform revenue = customer price - supplier price

## Quick Start

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run db:push --workspace backend
npm run db:seed --workspace backend
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

## Production Roadmap

- Real SMS OTP provider
- Payment integration
- Image upload storage via S3/Supabase Storage
- Push notifications
- Supplier verification workflow
- Admin audit logs
- Rate limiting by user/IP
- Arabic RTL refinements
