/**
 * Cache Refresh Cron Job
 * 
 * Runs nightly to refresh WPI cache from MCP server.
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/refresh-cache",
 *     "schedule": "0 20 * * *"  // 20:00 UTC = 01:30 AM IST
 *   }]
 * }
 * 
 * Also accepts manual triggers via GET request.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { indices } from '@/db/schema';
import { fetchWPI } from '@/lib/mcp-client';
import { eq, and } from 'drizzle-orm';

// Generate month ranges to refresh (current year + previous year)
function getMonthsToRefresh(): Array<{ year: number; month: number }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const months: Array<{ year: number; month: number }> = [];

    // Previous year (all 12 months)
    for (let m = 1; m <= 12; m++) {
        months.push({ year: currentYear - 1, month: m });
    }

    // Current year (up to current month)
    for (let m = 1; m <= currentMonth; m++) {
        months.push({ year: currentYear, month: m });
    }

    return months;
}

export async function GET(request: Request) {
    // Verify cron secret if configured (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }

    const startTime = Date.now();
    const results = {
        total: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        details: [] as Array<{ month: string; status: string }>,
    };

    const months = getMonthsToRefresh();
    results.total = months.length;

    for (const { year, month } of months) {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;

        try {
            // Check if we already have fresh data (< 24h old)
            const existing = await db
                .select()
                .from(indices)
                .where(
                    and(
                        eq(indices.type, 'WPI'),
                        eq(indices.year, year),
                        eq(indices.month, month),
                        eq(indices.source, 'MoSPI MCP')
                    )
                )
                .limit(1);

            if (existing.length > 0) {
                const age = Date.now() - (existing[0].createdAt?.getTime() || 0);
                const ageHours = age / (1000 * 60 * 60);

                if (ageHours < 24) {
                    results.skipped++;
                    results.details.push({ month: monthKey, status: 'fresh' });
                    continue;
                }
            }

            // Fetch from MCP
            const value = await fetchWPI(year, month);

            if (value !== null) {
                if (existing.length > 0) {
                    // Update existing record
                    await db.update(indices)
                        .set({ value, createdAt: new Date() })
                        .where(eq(indices.id, existing[0].id));
                } else {
                    // Insert new record
                    await db.insert(indices).values({
                        type: 'WPI',
                        year,
                        month,
                        value,
                        source: 'MoSPI MCP',
                    });
                }

                results.updated++;
                results.details.push({ month: monthKey, status: 'updated' });
            } else {
                results.skipped++;
                results.details.push({ month: monthKey, status: 'no-data' });
            }
        } catch (error) {
            results.errors++;
            results.details.push({
                month: monthKey,
                status: `error: ${error instanceof Error ? error.message : 'unknown'}`,
            });
        }

        // Small delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    const duration = Date.now() - startTime;

    return NextResponse.json({
        status: 'completed',
        timestamp: new Date().toISOString(),
        durationMs: duration,
        summary: {
            total: results.total,
            updated: results.updated,
            skipped: results.skipped,
            errors: results.errors,
        },
        details: results.details,
    });
}
