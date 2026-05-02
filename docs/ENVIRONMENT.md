# Environment Setup

Do not commit real environment files or secret values to GitHub.

## Backend local environment

Create this file locally only:

`backend/.env`

Required values:

```text
PORT=4000
DATABASE_URL=file:./dev.db
JWT_SECRET=replace-with-a-long-random-value
FRONTEND_URL=http://localhost:5173
ANTHROPIC_API_KEY=optional-for-live-ai
```

`ANTHROPIC_API_KEY` is optional during local testing. If it is not provided, the backend returns a safe demo fallback for AI part identification.

## Frontend local environment

Create this file locally only:

`frontend/.env`

Required values:

```text
VITE_API_URL=http://localhost:4000/api
```

## Production notes

Use platform secret managers for production values. Examples: Vercel Environment Variables, Render Environment, Railway Variables, or GitHub Actions Secrets.
