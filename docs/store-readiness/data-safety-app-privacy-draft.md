# Data Safety / App Privacy Draft Answers

This document is a working draft for Google Play Data Safety and Apple App Privacy answers. Final answers must match the actual production app behavior, third-party SDKs, hosting, OTP/email providers, analytics, and payment providers.

## Data Collected

Likely data categories collected:

### Contact Info
- Phone number
- Email address

Purpose:
- App functionality
- Account management
- Authentication
- Communication

Linked to user:
- Yes

### User Content
- Spare parts request descriptions
- Vehicle information
- Uploaded photos, if enabled
- Supplier offer notes
- Order notes

Purpose:
- App functionality
- Marketplace matching
- Order processing
- Customer support

Linked to user:
- Yes

### Identifiers
- Internal user ID
- Authentication/session identifiers

Purpose:
- App functionality
- Security
- Fraud prevention

Linked to user:
- Yes

### Purchases / Transaction Information
- Accepted offers
- Order value
- Payment status
- Settlement/payout status

Purpose:
- App functionality
- Order management
- Payment/settlement operations
- Legal/compliance records

Linked to user:
- Yes

### App Activity
- Requests created
- Offers submitted
- Orders updated
- Notifications
- Admin actions/audit logs

Purpose:
- App functionality
- Security
- Fraud prevention
- Operations

Linked to user:
- Yes

### Device / Diagnostics

Only declare this if production app uses analytics, crash reporting, logs, or monitoring SDKs that collect device or diagnostic data.

Purpose:
- App performance
- Crash/error monitoring
- Security

Linked to user:
- Depends on provider configuration

## Data Sharing

Current draft answer:
- Data is shared between customers, suppliers, and admins only as required for marketplace functionality.
- Data may be processed by service providers such as hosting, database, OTP, email, and AI/photo analysis providers.
- Data is not sold.

## Encryption

Answer:
- Data is transmitted over secure HTTPS connections.
- Hosting/database provider security controls should be confirmed before final submission.

## Account Deletion

Required:
- In-app deletion request flow
- External deletion link or support page/email path

Current gap:
- Need to confirm or implement a visible in-app Delete Account / Request Account Deletion option in Profile.

Suggested app wording:
"Request account deletion"

Suggested support wording:
"To request deletion of your account and associated personal data, contact support@autopartiq.com for IQ or support@autopartsae.com for AE. Some records may be retained where required for legal, fraud prevention, dispute resolution, financial, audit, or regulatory reasons."

## Final Checks Needed Before Submission

- Confirm whether Gemini/photo AI uploads are active in production
- Confirm whether payment provider is integrated
- Confirm whether analytics or crash reporting exists
- Confirm OTP providers:
  - IQ: OTPIQ
  - AE: currently Supabase Magic Link / future UAE OTP provider
- Confirm final support emails are active
- Confirm final domain/privacy policy URLs
- Confirm in-app account deletion request flow
