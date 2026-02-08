# HAM Price Escalation Calculator

> Production-ready calculator for **Hybrid Annuity Model (HAM)** price escalation in Indian highway contracts, implementing MCA Clause 23.4 formula.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-25%2F25%20passing-green)](__tests__/ham.test.ts)

---

## Features

✅ **3-Step Calculator Flow** — Contract details → Bill entry → Results  
✅ **Real-Time WPI Data** — Fetches from MoSPI MCP server  
✅ **Seeded CPI-IW Data** — 48 months (2022-2025) from Labour Bureau  
✅ **Government-Format PDFs** — Official price variation statement  
✅ **De-escalation Support** — Handles PIM < 1.0 correctly  
✅ **Mobile Responsive** — Works on phones, tablets, and desktops  
✅ **Easy Date Selection** — Year/month dropdown pickers for quick navigation  

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Turso credentials

# 3. Push database schema
npx drizzle-kit push

# 4. Seed CPI-IW data
npx tsx db/seed.ts

# 5. Start MCP server (in separate terminal)
cd ../esankhyiki-mcp
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
python mospi_server.py

# 6. Start dev server (in main terminal)
npm run dev
```

Visit **http://localhost:3000**

> **Note:** MCP server must be running on port 8000 for WPI auto-fetch to work.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Turso (LibSQL) + Drizzle ORM
- **PDF**: @react-pdf/renderer (Helvetica font)
- **Testing**: Vitest (25/25 tests passing)

---

## Project Structure

```
app/
├── components/
│   ├── ContractForm.tsx       # Step 1: Contract + date picker
│   ├── BillForm.tsx           # Step 2: Bill + auto-fetch
│   ├── ResultsView.tsx        # Step 3: Results + PDF
│   └── pdf/PriceVariationStatement.tsx  # PDF template
├── api/indices/route.ts       # GET indices by year/month
└── page.tsx                   # Main 3-step wizard

lib/
├── formulas/
│   ├── ham.ts                 # HAM formula (PIM, escalation)
│   └── base-month.ts          # MCA base/current month logic
├── mcp-client.ts              # Session-aware MCP client
├── index-service.ts           # Cache-first index fetching
└── db.ts                      # Turso connection

db/
├── schema.ts                  # Drizzle schema
├── seed.ts                    # CPI-IW seed script
└── seed_cpi_iw.sql            # Raw SQL (48 months)
```

---

## Usage Example

**Contract:** NH-45 Widening Pkg-III, Bid Date: April 1, 2022  
**Bill:** Report Date: Nov 1, 2024, Work Value: ₹ 87,45,000  

**Result:**
- **PIM** = 1.0780
- **Escalation** = ₹ 6,82,549
- **Total Payable** = ₹ 94,27,549

---

## API Reference

### GET `/api/indices?year=2024&month=10`

**Response:**
```json
{
  "wpi": { "value": 156.7, "source": "mcp", "isEstimate": false },
  "cpi": { "value": 144.5, "source": "seed", "isEstimate": false }
}
```

---

## Testing

```bash
# Run unit tests
npm test

# Build production
npm run build
```

**Unit Tests:** 8/8 passing ✅  
See [`TESTING.md`](./TESTING.md) for manual test guide.

---

## Environment Variables

```bash
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
MCP_URL=http://localhost:8000/mcp
```

---

## Formula Reference

### HAM Formula (MCA Clause 23.4)
```
P₀ = (0.70 × WPI_base) + (0.30 × CPI_base)
Pc = (0.70 × WPI_current) + (0.30 × CPI_current)
PIM = Pc / P₀
Escalation = Work Value × (PIM - 1)
```

### Base Month (MCA Clause 23.2.3)
- **Base Month** = Month preceding Bid Due Date
- **Current Month** = Two months before IE Report Date

---

## Deployment

### Vercel
```bash
vercel deploy --prod
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add MCP_URL
```

**Note:** MCP server must be deployed separately and accessible at `MCP_URL`.

---

## Documentation

- **[SPECIFICATION.md](../SPECIFICATION.md)** — Complete project spec
- **[TESTING.md](./TESTING.md)** — Manual testing guide
- **[walkthrough.md](../../.gemini/antigravity/brain/.../walkthrough.md)** — Implementation walkthrough

---

## Data Sources

- **WPI**: [MoSPI Official](https://eaindustry.nic.in/)
- **CPI-IW**: [Labour Bureau](https://labourbureau.gov.in/)

---

**Built for Indian Highway Contractors**
