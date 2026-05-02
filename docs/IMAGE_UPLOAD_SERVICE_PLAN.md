# Image Upload Service Plan

The current MVP supports image URLs for customer requests and supplier offers. The next production step is to replace manual URLs with real file uploads.

## Recommended provider

Use one of these services:

- Supabase Storage: best if Supabase is also used for PostgreSQL
- Cloudinary: easiest image optimization and transformations
- AWS S3: strongest long-term enterprise option

## Recommended MVP approach

Use Supabase Storage first because it is simple, affordable, and fits the database direction.

## Target workflow

1. User selects image in the frontend.
2. Frontend sends image to backend upload endpoint.
3. Backend validates file type and size.
4. Backend uploads file to storage provider.
5. Storage provider returns public or signed URL.
6. Backend stores URL in `photoUrlsJson`.
7. Frontend displays image previews.

## Backend endpoints to add later

- `POST /api/uploads/request-photo`
- `POST /api/uploads/offer-photo`

## Validation rules

- Allowed file types: JPEG, PNG, WebP
- Maximum file size: 5 MB per image
- Maximum images per request: 5
- Maximum images per offer: 5

## Storage path pattern

- `requests/{requestId}/{timestamp}-{filename}`
- `offers/{offerId}/{timestamp}-{filename}`

## Security notes

- Do not allow arbitrary file names without sanitization.
- Do not expose storage service secret keys to the frontend.
- Use backend-mediated upload for better validation and abuse control.
- Consider signed URLs later if images should not be fully public.

## Current status

Implemented:

- `PartRequest.photoUrlsJson`
- `Offer.photoUrlsJson`
- Customer request photo URL entry
- Supplier offer photo URL entry
- Customer offer photo preview

Pending:

- Real file picker
- Backend upload endpoint
- Storage provider connection
- Image compression/optimization
