# Arabic / English Translation Roadmap

The app now has a language context with English and Arabic dictionaries plus LTR/RTL switching.

## Implemented foundation

- `LanguageContext.jsx`
- Language toggle in the app header
- Main navigation labels
- Header labels
- Notification labels
- App direction switching between LTR and RTL

## Next translation work

Convert remaining hardcoded screen text to translation keys.

Priority screens:

1. Login screen
2. Customer request form
3. Customer offer and checkout cards
4. Customer order tracking
5. Supplier leads and offer form
6. Supplier earnings
7. Admin dashboard
8. Admin supplier management
9. Admin order controls

## Translation key style

Use short stable keys, for example:

- `loginWelcome`
- `phoneNumber`
- `sendCode`
- `verifySignIn`
- `partName`
- `supplierPrice`
- `checkoutPreview`
- `cashOnDelivery`
- `markCompleted`

## UI considerations for Arabic

- Keep numbers in IQD format readable.
- Use RTL direction for Arabic.
- Keep car makes and models in English unless local Arabic equivalents are confirmed.
- Avoid overly long Arabic labels in bottom navigation.
- Test button wrapping on small phone screens.

## Current status

Foundation complete. Full string coverage is pending and should be done gradually screen by screen.
