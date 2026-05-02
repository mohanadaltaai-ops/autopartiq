# Claude Change Log Implementation Roadmap

This document records the requested feature/change list to be implemented into the deployed React + Express + Prisma version of AutoParts IQ.

## Current implementation approach

Implement changes in controlled batches to avoid breaking the already working online deployment.

## Batch 1 — Core business rules and privacy

- Move order completion/status management to Admin/Super Admin only.
- Make supplier order status read-only.
- Use status display flow: Waiting Pickup, Delivering, Completed, Cancelled.
- Confirm order number format: three letters + four digits.
- Add Admin order search/filter by order number and status.
- Exclude cancelled orders from supplier earnings and platform revenue.
- Restrict supplier visibility: no customer name, phone, or detailed location.
- Make customer phone and detailed location mandatory.
- Ensure delivery info controls are visible only to Admin/Super Admin.
- Remove Admin earnings dashboard visibility; financial dashboards belong to Super Admin.

## Batch 2 — Request form and customer flow

- Add optional part number.
- Add optional chassis number / VIN.
- Add customer optional photo upload structure up to four photos.
- Customer home split into New Request and My Requests tabs.
- Request cancellation requires mandatory reason.
- Auto-switch to My Requests after request submit.
- Offers appear under request card with price and View button.
- Notifications bell alerts when offers are received.

## Batch 3 — Supplier offer flow

- Supplier offer requires at least one photo.
- Offer queue system: prepare multiple offers, then send all at once.
- Lead disappears after supplier sends offers for it.
- Supplier home split into Leads and Sent Offers tabs.
- Supplier can cancel sent offer with mandatory reason.

## Batch 4 — Authentication and Super Admin

- Remove role switcher from UI.
- Role detected automatically from phone number.
- Hidden Super Admin login entry.
- Super Admin login with phone or username + password.
- Hardcoded emergency fallback credentials for Super Admin.
- Super Admin can enroll additional Super Admins with email, username, password.
- Admin enrollment restricted to Super Admin only.

## Batch 5 — Branding, translation, profile

- App name: AutoParts IQ / سوق قطع الغيار العراقي.
- Embed provided logo after user uploads it.
- Full Arabic translation and RTL layout.
- Language selector as first screen before login.
- Language toggle in Profile settings.
- Profile screen for all users: language switch, dark/light mode, support contact, logout.
- All screens should have back or home button.

## Batch 6 — Car data and AI

- Full car database: six origins, 25+ brands, 150+ models for Iraqi market.
- Origin selection with flag emojis.
- Model selection as grid buttons.
- Replace Claude AI with Google AI API for part identification.

## Batch 7 — Super Admin dashboard and exports

- Orders tab with advanced filters: supplier, status, dates, order number.
- Financial tab with advanced filters and Excel export.
- Supplier tab with per-supplier stats: supplier earnings and platform revenue.
- Supplier filtering/edit/enrollment.

## Batch 8 — Expandable details

- Offer cards tappable to expand full details with photos and pricing.
- Order cards tappable to expand full details with delivery info and action buttons.

## Already implemented or partially implemented

- Tiered margin structure: under 100k = 10%, 100k–200k = 13%, over 200k = 14%.
- Notifications foundation.
- Payment/delivery placeholder foundation.
- Admin supplier edit/disable foundation.
- Audit logs foundation.
- Basic Arabic/English language context.
- Online Vercel + Render + Supabase deployment.
