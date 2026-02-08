# Testing Guide for HAM Price Escalation Calculator

## Prerequisites

1. **Start MCP Server** (for WPI data):
   ```bash
   cd d:\Projects\gov-mcp\esankhyiki-mcp
   .\venv\Scripts\Activate.ps1
   python mospi_server.py
   ```
   > Server runs on http://localhost:8000/mcp

2. **Start Next.js Dev Server** (already running):
   ```bash
   cd d:\Projects\gov-mcp\contractor-app
   npm run dev
   ```
   Server: http://localhost:3000

## UI Testing Flow

### Step 1: Contract Form
1. Open http://localhost:3000 in browser
2. Verify the title "HAM Price Escalation Calculator"
3. Enter contract name: `NH-45 Widening Pkg-III`
4. Select Bid Due Date: `April 1, 2022`
5. **Expected:** Base Index Month displays `March 2022`
6. Click "Continue to Bill Details"

### Step 2: Bill Form
1. Select IE Report Date: `November 1, 2024`
2. Enter Work Value: `8745000`
3. **Expected:** Auto-fetch indices:
   - WPI Base (Mar 2022): ~148.8 (from MCP API)
   - WPI Current (Oct 2024): ~156.7 (from MCP API)
   - CPI-IW Base (Mar 2022): 126.0 (from seed)
   - CPI-IW Current (Oct 2024): 144.5 (from seed)
4. Verify all indices load without errors
5. Click "Calculate Escalation"

### Step 3: Results View
1. **Expected calculations:**
   - P₀ = (0.7 × 148.8) + (0.3 × 126.0) = 141.96
   - Pc = (0.7 × 156.7) + (0.3 × 144.5) = 153.04
   - PIM = 153.04 / 141.96 ≈ 1.0780
   - Escalation: ₹ 6,82,549 (approx)
   - Total Payable: ₹ 94,27,549 (approx)
2. Verify de-escalation indicator is NOT shown (PIM > 1)
3. Click "Download PDF"
4. Verify PDF downloads with correct filename
5. Open PDF and verify:
   - Government format header
   - All dates and indices shown
   - Amount in words
   - Footer with generation timestamp

## API Testing

### Test CPI-IW (Seed Data)
```bash
curl "http://localhost:3000/api/indices?year=2024&month=10"
```
**Expected response:**
```json
{
  "wpi": null,
  "cpi": {
    "value": 144.5,
    "source": "seed",
    "isEstimate": false
  },
  "year": 2024,
  "month": 10
}
```

### Test WPI (MCP Server - requires MCP running)
```bash
curl "http://localhost:3000/api/indices?year=2022&month=3"
```
**Expected response:**
```json
{
  "wpi": {
    "value": 148.8,
    "source": "mcp",
    "isEstimate": false
  },
  "cpi": {
    "value": 126.0,
    "source": "seed",
    "isEstimate": false
  },
  "year": 2022,
  "month": 3
}
```

## Known Limitations

1. **MCP Server Optional:** WPI data uses multi-tier fallback (cache → MCP → seed → estimate)
2. **CPI-IW Range:** Seed data covers 2022-2025 (48 months)
3. **WPI Range:** Seed data covers 2022-2024 (36 months)
4. **MCP Timeout:** 5 seconds - falls back to seed if MCP unavailable
5. **PDF Fonts:** Using built-in Helvetica font (no external dependencies)

---

## Unit Tests (25 tests)

Run with: `npm test`

### Test Categories:
| Category | Count | Description |
|----------|-------|-------------|
| Constants | 1 | WPI 70%, CPI 30% weights |
| Formula Validation | 1 | IJCRT benchmark (old series) |
| Real-World Validation | 1 | Current series with MCP data |
| Edge Cases | 4 | Zero/negative values, de-escalation |
| Breakdown Calculation | 1 | Weighted component verification |
| **Extreme Values** | 7 | ₹1 to ₹1000 crore, 50% inflation, 30% deflation |
| **Precision** | 3 | Floating point, repeating decimals, NaN checks |
| **Asymmetric** | 3 | WPI↑ CPI↓, WPI↓ CPI↑, weight verification |
| **Boundary Months** | 2 | Jan 2015, Dec→Jan transitions |
| **Real Contracts** | 3 | 1-month, 3-year, typical RA bill |

---

## Test Scenarios

### Scenario 1: Normal Escalation (PIM > 1)
- Bid Date: April 1, 2022 → Base: Mar 2022
- Report Date: Nov 1, 2024 → Current: Oct 2024
- Work Value: ₹ 87,45,000
- **Expected:** Positive escalation ~₹ 6.8 lakh

### Scenario 2: De-escalation (PIM < 1)
- Bid Date: Nov 1, 2024 → Base: Oct 2024
- Report Date: May 1, 2022 → Current: Apr 2022
- Work Value: ₹ 1,00,00,000
- **Expected:** Negative escalation (de-escalation shown in red)

### Scenario 3: CPI-IW Estimate
- Use a month beyond Dec 2025 for current month
- **Expected:** CPI-IW shows "Estimated" badge with most recent month

## Success Criteria

✅ All 3 forms load without errors
✅ Date pickers with year/month dropdowns work correctly
✅ Base month auto-calculates from bid date (preceding month)
✅ Current month auto-calculates from report date (two months prior)
✅ Indices auto-fetch via API
✅ PIM calculation matches expected value (±0.01)
✅ PDF downloads successfully (Helvetica font)
✅ PDF contains all required information in government format
✅ Amount in words displays correctly
✅ Mobile responsive layout works

