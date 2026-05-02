# AutoPartIQ Stabilization Checklist

## Completed in first stabilization pass

- Added root monorepo scripts for local development.
- Added safe environment setup documentation.
- Expanded Admin page with supplier and orders tabs.
- Added supplier creation UI in the Admin section.
- Pinned frontend dependency versions.
- Added Vite React configuration.
- Confirmed backend package uses Prisma generation during build.
- Updated README to match the actual repository state.

## Next technical priorities

1. Run the app locally and fix any runtime errors.
2. Add form validation with Zod on backend routes.
3. Add role-based authorization checks at the record level.
4. Replace demo OTP with a real SMS provider.
5. Add image upload storage for part/request photos.
6. Add automated tests for pricing, request flow, offer flow, and order creation.
7. Add CI workflow once repository safety filtering allows workflow file upload.
8. Improve Arabic RTL support and bilingual UI strings.
9. Move production database from SQLite to PostgreSQL.
10. Add audit logs for Admin and Super Admin actions.

## Product priorities

1. Match the Claude demo visual design more closely.
2. Add notification center for customer offers.
3. Add supplier earnings transaction list.
4. Add admin supplier edit/delete functionality.
5. Add order status controls for admin delivery workflow.
6. Add customer cancellation reason flow.
