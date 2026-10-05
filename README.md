# ATM Apparel Shopping App

Migrated from Replit and prepared for GitHub-based development.

## Project structure

- `artifacts/atm-apparel` — Expo / React Native ATM Apparel shopping app
- `artifacts/api-server` — Express API server
- `artifacts/mockup-sandbox` — Vite-based design/mockup sandbox
- `lib/db` — Drizzle/PostgreSQL database package
- `lib/api-client-react` — generated React API client
- `lib/api-zod` — API validation/types

## Requirements

- Node.js 20+ (Node 22 recommended)
- pnpm 10+
- PostgreSQL for database-backed features
- Shopify Storefront API credentials if Shopify product/cart routes are enabled

## First setup

```bash
corepack enable
pnpm install
cp .env.example .env
```

Fill in `.env` locally. **Never commit `.env` or API credentials to GitHub.**

## Run the API

```bash
pnpm --filter @workspace/api-server dev
```

The API requires `PORT` and, for database-backed routes, `DATABASE_URL`.

## Run the ATM Apparel app

```bash
pnpm --filter @workspace/atm-apparel dev
```

The app uses Expo. Use Expo Go or an appropriate Expo development workflow to open it.

## Database

The database package uses Drizzle ORM.

```bash
pnpm --filter @workspace/db push
```

Only run database commands after `DATABASE_URL` points to the intended PostgreSQL database.

## Shopify

The migrated project no longer depends on Replit's Shopify connector. Configure:

- `SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`

These are read by the API server at runtime.

## GitHub safety

Do not commit:

- `.env`
- database passwords
- Shopify Admin API tokens
- private keys
- build output
- `node_modules`

This repository is intentionally prepared without the original Replit `.git` metadata or `.replit` configuration. Create a new Git history when pushing it to your GitHub repository.
