# Quick Start Guide

This guide gets you from cloned repository to running app in 5 minutes.

## Prerequisites

- **Node.js 22** (or 20+): https://nodejs.org/
- **pnpm 10+**: `npm install -g pnpm@10`
- **PostgreSQL 14+** (for database routes): `brew install postgresql` or use Docker
- **Git**

## 1. Extract the Project (1 minute)

```bash
# Clone or navigate to the repo
cd ATM-Apparel-Shopping-App

# Extract the source code
unzip -o ATM-Apparel-Shopping-App-GitHub-Ready.zip

# Verify extraction
ls -la artifacts/ lib/ scripts/
```

You should now see folders like `artifacts/atm-apparel/`, `artifacts/api-server/`, etc.

## 2. Install Dependencies (2 minutes)

```bash
# Enable pnpm via corepack
corepack enable

# Install all workspace dependencies
pnpm install
```

## 3. Set Up Environment (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit with your values (or use defaults for local dev)
# nano .env
```

**For local development, defaults work:**
- API runs on `http://localhost:3000`
- Database: `postgresql://postgres:postgres@localhost:5432/atm_apparel`

## 4. Start PostgreSQL (1 minute)

### Option A: Docker (Recommended)

```bash
docker run --name atm-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=atm_apparel \
  -p 5432:5432 \
  -d postgres:16
```

### Option B: Using docker-compose

```bash
docker-compose up -d postgres
```

### Option C: Local PostgreSQL (Mac/Linux/Windows)

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Windows: Start PostgreSQL from Services app or:
pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

## 5. Run the App (Now!)

### Terminal 1: Start API Server

```bash
pnpm --filter @workspace/api-server dev
```

Output should show:
```
Server running on http://localhost:3000
```

### Terminal 2: Start Expo App

```bash
pnpm --filter @workspace/atm-apparel dev
```

Output should show:
```
Metro Bundler ready at http://localhost:19000
Scan the QR code above with Expo Go
```

### Terminal 3 (Optional): Run Mockup Sandbox

```bash
pnpm --filter @workspace/mockup-sandbox dev
```

Browser opens to `http://localhost:5173`

## 6. Open the App

**On your phone:**
1. Download **Expo Go** app (iOS App Store or Google Play)
2. Scan the QR code from Terminal 2
3. App opens in Expo Go

**On your computer:**
1. Use iOS Simulator: `xcrun simctl openurl booted exp://localhost:19000`
2. Use Android Emulator: run it first, then scan QR code

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `pnpm: command not found` | Run `corepack enable` |
| `PostgreSQL connection refused` | Start PostgreSQL (see Step 4) or check `DATABASE_URL` in `.env` |
| `Port 3000 already in use` | Change `PORT=3001` in `.env` or kill the process: `lsof -ti:3000 \| xargs kill -9` |
| `QR code won't scan` | Update `EXPO_PUBLIC_API_BASE_URL=http://YOUR_IP:3000` in `.env` |
| `Module not found` | Run `pnpm install` again |

## What's Running?

| Service | Port | Purpose |
|---------|------|---------|
| **API Server** | 3000 | REST API backend |
| **Expo Bundler** | 19000 | Mobile app dev server |
| **Mockup Sandbox** | 5173 | Design/UI preview |
| **PostgreSQL** | 5432 | Database |

## Next Steps

- **Read the API docs**: Check `artifacts/api-server/src/` for route definitions
- **Explore the app**: Check `artifacts/atm-apparel/src/app/` for screens
- **View database schema**: Check `lib/db/src/schema.ts`
- **Deploy**: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Useful Commands

```bash
# Run type checking
pnpm run typecheck

# Build for production
pnpm run build

# Check for vulnerable packages
pnpm audit

# Update packages
pnpm update

# Clean all build artifacts
pnpm --recursive run clean
```

## Stop Services

```bash
# Stop API server and Expo (Ctrl+C in terminals)

# Stop PostgreSQL
docker stop atm-postgres
# or
docker-compose down

# Stop macOS PostgreSQL
brew services stop postgresql
```

## Need Help?

- **Full deployment guide**: See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Project structure**: See [README.md](./README.md)
- **Environment variables**: See [.env.example](./.env.example)

---

**You're now running ATM Apparel locally!** 🎉
