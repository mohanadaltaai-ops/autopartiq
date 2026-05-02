# AutoPartIQ Stabilization Checklist

## Completed

- Added root monorepo scripts for local development.
- Added safe environment setup documentation.
- Expanded Admin page with supplier and orders tabs.
- Added supplier creation UI in the Admin section.
- Pinned frontend dependency versions.
- Added Vite React configuration.
- Confirmed backend package uses Prisma generation during build.
- Updated README to match the actual repository state.
- Switched Prisma datasource to PostgreSQL to match production direction.
- Added customer notifications backend and frontend UI.
- Added admin order status controls.
- Added supplier earnings transaction list.
- Added request and offer photo URL structure.
- Improved customer/supplier loading, error, and empty states.
- Added stronger backend ownership and status validation.

## Manual follow-up / previously blocked items

These were blocked by safety filtering or need manual setup later:

1. GitHub Actions CI workflow file upload.
2. Committing `.env.example` files. Environment guidance is documented in `docs/ENVIRONMENT.md` instead.
3. Full local Docker testing. Docker could not run yet because virtualization was not enabled on the local machine.
4. Local test runbook file with terminal command blocks. The steps were provided in chat, but the file upload was blocked.

## Next technical priorities

1. Add image upload storage abstraction for request/offer photos.
2. Add form validation with Zod on backend routes.
3. Replace demo OTP with a real SMS provider.
4. Add automated tests for pricing, request flow, offer flow, and order creation.
5. Improve Arabic RTL support and bilingual UI strings.
6. Add audit logs for Admin and Super Admin actions.
7. Prepare online testing/deployment path using hosted database and hosted frontend/backend.

## Product priorities

1. Match the Claude demo visual design more closely.
2. Add customer cancellation reason flow.
3. Add admin supplier edit/delete functionality.
4. Add order status controls for admin delivery workflow improvements.
5. Add payment-ready checkout placeholder.
6. Add delivery partner workflow placeholder.
