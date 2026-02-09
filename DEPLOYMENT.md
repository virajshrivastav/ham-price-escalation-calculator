# Deployment Guide

## Vercel Deployment

### Prerequisites
1. Turso database with schema and seed data
2. GitHub repository (already done ✅)

### Step 1: Import to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import `virajshrivastav/ham-price-escalation-calculator`

### Step 2: Configure Environment Variables
In Vercel project settings, add these environment variables:

| Variable | Value | Required |
|----------|-------|----------|
| `TURSO_DATABASE_URL` | `libsql://your-db.turso.io` | ✅ Yes |
| `TURSO_AUTH_TOKEN` | Your Turso auth token | ✅ Yes |
| `MCP_URL` | (leave empty for production) | ❌ Optional |

**Note:** MCP_URL is optional. The app uses WPI seed data as fallback.

### Step 3: Deploy
1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Visit your deployed URL

### Step 4: Seed Production Database
After deployment, seed the database:

```bash
# Set production env vars locally
export TURSO_DATABASE_URL="your-production-url"
export TURSO_AUTH_TOKEN="your-production-token"

# Run seeds
npx tsx db/seed.ts      # CPI-IW (48 months)
npx tsx db/seed_wpi.ts  # WPI (36 months)
```

---

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Seed database (first time only)
npx drizzle-kit push
npx tsx db/seed.ts
npx tsx db/seed_wpi.ts

# Start dev server
npm run dev
```

Visit http://localhost:3000

---

## Testing

```bash
# Run all 25 unit tests
npm test

# Watch mode
npm run test:watch
```

---

## Troubleshooting

**Build fails on Vercel:**
- Check environment variables are set correctly
- Verify Turso database URL is accessible

**WPI not loading:**
- Normal! App uses seed data fallback (36 months)
- MCP server is only for local development

**Tests fail:**
- Ensure Node.js 18+ is installed
- Run `npm install` to update dependencies
