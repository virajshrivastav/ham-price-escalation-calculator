/**
 * Seed CPI-IW data into Turso database
 * Run with: npx tsx db/seed.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import { indices } from './schema';

const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

// CPI-IW General Index, Base 2016=100
// Source: Labour Bureau Press Releases
const cpiData = [
    // 2022
    { year: 2022, month: 1, value: 125.1 },
    { year: 2022, month: 2, value: 125.0 },
    { year: 2022, month: 3, value: 126.0 },
    { year: 2022, month: 4, value: 127.7 },
    { year: 2022, month: 5, value: 129.0 },
    { year: 2022, month: 6, value: 129.2 },
    { year: 2022, month: 7, value: 129.9 },
    { year: 2022, month: 8, value: 130.2 },
    { year: 2022, month: 9, value: 131.3 },
    { year: 2022, month: 10, value: 132.5 },
    { year: 2022, month: 11, value: 132.5 },
    { year: 2022, month: 12, value: 132.3 },
    // 2023
    { year: 2023, month: 1, value: 132.8 },
    { year: 2023, month: 2, value: 132.7 },
    { year: 2023, month: 3, value: 133.3 },
    { year: 2023, month: 4, value: 134.2 },
    { year: 2023, month: 5, value: 134.7 },
    { year: 2023, month: 6, value: 136.4 },
    { year: 2023, month: 7, value: 139.7 },
    { year: 2023, month: 8, value: 139.2 },
    { year: 2023, month: 9, value: 137.5 },
    { year: 2023, month: 10, value: 138.4 },
    { year: 2023, month: 11, value: 139.1 },
    { year: 2023, month: 12, value: 138.8 },
    // 2024
    { year: 2024, month: 1, value: 138.9 },
    { year: 2024, month: 2, value: 139.2 },
    { year: 2024, month: 3, value: 138.9 },
    { year: 2024, month: 4, value: 139.4 },
    { year: 2024, month: 5, value: 139.9 },
    { year: 2024, month: 6, value: 141.4 },
    { year: 2024, month: 7, value: 142.7 },
    { year: 2024, month: 8, value: 142.6 },
    { year: 2024, month: 9, value: 143.3 },
    { year: 2024, month: 10, value: 144.5 },
    { year: 2024, month: 11, value: 144.5 },
    { year: 2024, month: 12, value: 143.7 },
    // 2025
    { year: 2025, month: 1, value: 143.2 },
    { year: 2025, month: 2, value: 142.8 },
    { year: 2025, month: 3, value: 143.0 },
    { year: 2025, month: 4, value: 143.5 },
    { year: 2025, month: 5, value: 144.0 },
    { year: 2025, month: 6, value: 145.0 },
    { year: 2025, month: 7, value: 146.5 },
    { year: 2025, month: 8, value: 147.1 },
    { year: 2025, month: 9, value: 147.3 },
    { year: 2025, month: 10, value: 147.7 },
    { year: 2025, month: 11, value: 148.2 },
    { year: 2025, month: 12, value: 148.2 },
];

async function seed() {
    console.log('🌱 Seeding CPI-IW data...');

    const rows = cpiData.map(d => ({
        type: 'CPI-IW' as const,
        year: d.year,
        month: d.month,
        value: d.value,
        source: 'Labour Bureau',
    }));

    await db.insert(indices).values(rows);

    console.log(`✅ Seeded ${rows.length} CPI-IW records (2022-2025)`);
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
