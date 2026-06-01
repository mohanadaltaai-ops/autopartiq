# PartLink IQ / PartLink AE - Store Submission Checklist

Last updated: May 2026

## 1. Current Technical Status

### Completed

- Production smoke-tested checkpoint exists.
- Mobile metadata and PWA manifests added.
- IQ and AE manifests are working.
- App titles are market-aware:
  - PartLink IQ
  - PartLink AE
- Store icon and splash assets generated.
- Store listing draft created.
- Privacy Policy draft created.
- Terms of Use draft created.
- Data Safety / App Privacy draft created.
- Profile support section is market-aware.
- Profile account deletion request email is market-aware.
- Public Privacy Policy page added:
  - /privacy-policy
- Public Terms of Use page added:
  - /terms-of-use
- Public legal pages support scrolling.

### Current Checkpoints

- v0.2.15-production-smoke-tested
- v0.2.16-mobile-metadata-pwa
- v0.2.17-store-assets
- v0.2.18-market-aware-account-deletion
- v0.2.19-profile-market-support-fix
- v0.2.20-public-legal-pages

## 2. Public URLs Needed Before Store Submission

These should be replaced with final production domain URLs before public launch.

### IQ

- App URL: [Insert IQ production URL]
- Privacy Policy URL: [Insert IQ production URL]/privacy-policy
- Terms of Use URL: [Insert IQ production URL]/terms-of-use
- Support Email: support@autopartiq.com

### AE

- App URL: [Insert AE production URL]
- Privacy Policy URL: [Insert AE production URL]/privacy-policy
- Terms of Use URL: [Insert AE production URL]/terms-of-use
- Support Email: support@autopartsae.com

## 3. Google Play Requirements

### Required Items

- App name
- Short description
- Full description
- App icon 512x512
- Feature graphic
- Phone screenshots
- Privacy Policy URL
- App category
- Contact email
- Data Safety form
- Target audience / content rating
- Account deletion information
- Production app build

### Current Status

- App name: Ready
- Short description: Draft ready
- Full description: Draft ready
- App icon: Initial generated asset ready
- Privacy Policy URL: Public page ready, final domain pending
- Terms URL: Public page ready, final domain pending
- Data Safety draft: Ready for review
- Account deletion: In-app email request available
- Screenshots: Pending
- Feature graphic: Pending
- Final Android build: Pending

## 4. Apple App Store Requirements

### Required Items

- App name
- Subtitle
- Promotional text
- Description
- Keywords
- Support URL
- Marketing URL, optional
- Privacy Policy URL
- App icon 1024x1024
- iPhone screenshots
- App Privacy answers
- Age rating
- Final iOS build uploaded from Xcode / Transporter

### Current Status

- App name: Ready
- Subtitle: Draft ready
- Promotional text: Draft ready
- Description: Draft ready
- Keywords: Draft ready
- App icon 1024x1024: Initial generated asset ready
- Privacy Policy URL: Public page ready, final domain pending
- Terms URL: Public page ready, final domain pending
- App Privacy draft: Ready for review
- Screenshots: Pending
- Final iOS build: Pending
- Apple Developer account setup: Pending / confirm

## 5. Store Assets

### Existing Generated Assets

Location:

frontend/public/store

Files:

- app-icon-1024.png
- google-play-icon-512.png
- apple-touch-icon-180.png
- pwa-icon-192.png
- pwa-icon-512.png
- splash-iq-1242x2688.png
- splash-ae-1242x2688.png

### Pending Assets

- Google Play feature graphic
- Final app screenshots for IQ
- Final app screenshots for AE
- Possible final professional app icon refinement
- Optional promotional screenshots with captions

## 6. Account Deletion

### Current Status

The Profile page includes a market-aware request account deletion email link.

IQ users contact:

support@autopartiq.com

AE users contact:

support@autopartsae.com

### Pending Improvement

Before full public launch, consider adding a backend-tracked account deletion request table and admin workflow.

Suggested future flow:

1. User clicks Request Account Deletion.
2. App opens an in-app confirmation form.
3. Backend stores deletion request.
4. Admin reviews and processes request.
5. User receives confirmation by email/SMS.

## 7. UAE / AE Pending Items

- Choose UAE OTP provider.
- Replace AE Magic Link with UAE phone OTP when ready.
- Add UAE support WhatsApp number if available.
- Confirm UAE legal/company registration details.
- Confirm UAE support email is active.
- Confirm UAE domain/final app URL.

## 8. IQ Pending Items

- Confirm OTPIQ production OTP is stable.
- Confirm App Owner real OTP login still works.
- Confirm support@autopartiq.com is active.
- Confirm IQ domain/final app URL.
- Prepare IQ screenshots.

## 9. Final Pre-Submission Testing

### Customer

- Login
- Create request
- Save vehicle
- Set default vehicle
- Receive supplier offer
- Accept offer
- Track order
- Request account deletion

### Supplier

- Login
- View leads
- Submit offer
- View sent offers
- View accepted/rejected offer status
- View orders

### Orders Admin

- Login
- View orders
- Receive notification
- Open order from notification
- Update order status

### Full Admin / Super Admin

- Dashboard
- Suppliers
- Orders
- Settlements
- Audit logs
- Market filters
- App Owner protection

## 10. Recommended Next Steps

1. Confirm this checklist.
2. Prepare screenshots for IQ and AE.
3. Prepare Google Play feature graphic.
4. Finalize Privacy Policy and Terms text after company/domain details are known.
5. Confirm support emails are active.
6. Later implement UAE OTP provider.
7. Later prepare actual Android and iOS builds.
