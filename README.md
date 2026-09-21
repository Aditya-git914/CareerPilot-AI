# AI Career Coach

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Copy env template and fill values:

```bash
cp .env.example .env
```

3. Run development server:

```bash
npm run dev
```

## Required environment variables

See `.env.example` for the complete list:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
- `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
- `DATABASE_URL`
- `GEMINI_API_KEY`

## Build and deploy

```bash
npm run lint
npm run build
```

This repo is configured for Vercel:

- `next build` is the build command
- Prisma client generation runs automatically on install via `postinstall`

On Vercel, add the same environment variables from `.env.example` in Project Settings.
