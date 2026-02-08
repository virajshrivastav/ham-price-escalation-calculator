/**
 * WPI Seed Data
 * 
 * Wholesale Price Index - All Commodities (Base: 2011-12=100)
 * Source: Office of Economic Adviser (OEA), MoSPI
 * 
 * This provides fallback data when MCP server is unavailable.
 * Run with: npx tsx db/seed_wpi.ts
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

// WPI All Commodities (Major Group Code: 1000000000)
// Source: eaindustry.nic.in
const wpiData = [
    // 2022
    { year: 2022, month: 1, value: 144.7 },
    { year: 2022, month: 2, value: 146.4 },
    { year: 2022, month: 3, value: 148.8 },
    { year: 2022, month: 4, value: 150.0 },
    { year: 2022, month: 5, value: 151.5 },
    { year: 2022, month: 6, value: 152.2 },
    { year: 2022, month: 7, value: 151.7 },
    { year: 2022, month: 8, value: 151.0 },
    { year: 2022, month: 9, value: 150.6 },
    { year: 2022, month: 10, value: 150.8 },
    { year: 2022, month: 11, value: 150.1 },
    { year: 2022, month: 12, value: 150.4 },
    // 2023
    { year: 2023, month: 1, value: 149.4 },
    { year: 2023, month: 2, value: 149.2 },
    { year: 2023, month: 3, value: 148.7 },
    { year: 2023, month: 4, value: 147.9 },
    { year: 2023, month: 5, value: 146.4 },
    { year: 2023, month: 6, value: 145.8 },
    { year: 2023, month: 7, value: 147.5 },
    { year: 2023, month: 8, value: 149.1 },
    { year: 2023, month: 9, value: 149.3 },
    { year: 2023, month: 10, value: 149.2 },
    { year: 2023, month: 11, value: 149.0 },
    { year: 2023, month: 12, value: 149.7 },
    // 2024
    { year: 2024, month: 1, value: 150.2 },
    { year: 2024, month: 2, value: 150.7 },
    { year: 2024, month: 3, value: 151.4 },
    { year: 2024, month: 4, value: 152.3 },
    { year: 2024, month: 5, value: 153.0 },
    { year: 2024, month: 6, value: 153.6 },
    { year: 2024, month: 7, value: 154.2 },
    { year: 2024, month: 8, value: 154.8 },
    { year: 2024, month: 9, value: 155.5 },
    { year: 2024, month: 10, value: 156.7 },
    { year: 2024, month: 11, value: 157.2 },
    { year: 2024, month: 12, value: 157.8 },
];

export async function seedWPI() {
    console.log('🌱 Seeding WPI data (36 months: 2022-2024)...');

    let inserted = 0;
    let skipped = 0;

    for (const item of wpiData) {
        try {
            await db.insert(indices).values({
                type: 'WPI',
                year: item.year,
                month: item.month,
                value: item.value,
                source: 'OEA Seed',
            });
            inserted++;
        } catch (e: unknown) {
            // Skip if already exists (unique constraint)
            const errorMessage = e instanceof Error ? e.message : String(e);
            if (errorMessage.includes('UNIQUE')) {
                skipped++;
            } else {
                throw e;
            }
        }
    }

    console.log(`✅ WPI seed complete: ${inserted} inserted, ${skipped} skipped`);
}

// Run if executed directly
if (require.main === module) {
    seedWPI()
        .then(() => process.exit(0))
        .catch((e) => {
            console.error('❌ WPI seed failed:', e);
            process.exit(1);
        });
}
